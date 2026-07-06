import os
import uuid
import logging
from typing import List, Dict, Any
import chromadb
from backend.config import CHROMA_DB_DIR
from backend.embeddings import EmbeddingManager

logger = logging.getLogger("agentflow.vector_store")

class RAGVectorStore:
    """
    ChromaDB vector store wrapper to handle:
    - Text chunking of uploaded PDFs.
    - Storing vectors using the EmbeddingManager.
    - Similarity query retrieval for RAG.
    """
    def __init__(self):
        # Initialize persistent Chroma client
        self.client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
        self.embedding_manager = EmbeddingManager()
        
        # We will use a single unified collection for the workspace
        # to search across all uploaded documents.
        self.collection_name = "agentflow_workspace"
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name
        )
        logger.info(f"ChromaDB persistent collection '{self.collection_name}' initialized.")

    def chunk_text(self, text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> List[str]:
        """
        Splits raw text into overlapping semantic passages.
        """
        if not text:
            return []
            
        chunks = []
        start = 0
        text_len = len(text)
        
        while start < text_len:
            end = min(start + chunk_size, text_len)
            chunk = text[start:end]
            chunks.append(chunk)
            # Move index forward by chunk_size - overlap
            start += chunk_size - chunk_overlap
            if end == text_len:
                break
        return chunks

    def add_document(self, filename: str, text: str) -> int:
        """
        Chunks the document text, generates embeddings, and saves them to ChromaDB.
        Returns the number of chunks added.
        """
        chunks = self.chunk_text(text)
        if not chunks:
            return 0
            
        # Generate embeddings for all chunks
        embeddings = self.embedding_manager.embed_documents(chunks)
        
        ids = [f"{filename}_{uuid.uuid4()}" for _ in range(len(chunks))]
        metadatas = [{"filename": filename} for _ in range(len(chunks))]
        
        # Add to Chroma collection
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=chunks
        )
        
        logger.info(f"Added {len(chunks)} chunks for document '{filename}' into vector store.")
        return len(chunks)

    def query(self, query_text: str, n_results: int = 4, filter_filename: str = None) -> List[Dict[str, Any]]:
        """
        Searches ChromaDB for relevant text chunks.
        Optionally filters by a specific document's filename.
        """
        query_vector = self.embedding_manager.embed_query(query_text)
        
        where = {}
        if filter_filename:
            where["filename"] = filter_filename
            
        results = self.collection.query(
            query_embeddings=[query_vector],
            n_results=n_results,
            where=where if where else None
        )
        
        formatted_results = []
        if results and results["documents"]:
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            ids = results["ids"][0]
            distances = results["distances"][0] if "distances" in results and results["distances"] else [0.0]*len(docs)
            
            for i in range(len(docs)):
                formatted_results.append({
                    "id": ids[i],
                    "text": docs[i],
                    "metadata": metas[i],
                    "filename": metas[i].get("filename", "unknown"),
                    "distance": distances[i]
                })
                
        return formatted_results

    def delete_document(self, filename: str):
        """
        Deletes all chunks corresponding to a specific filename.
        """
        self.collection.delete(
            where={"filename": filename}
        )
        logger.info(f"Deleted all vector store chunks for document '{filename}'.")

# Singleton instance of RAG vector store
vector_store = RAGVectorStore()
