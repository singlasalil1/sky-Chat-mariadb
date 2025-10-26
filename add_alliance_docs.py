#!/usr/bin/env python3
"""
Add Alliance Documents Script
==============================
This script adds airline alliance documents to an existing RAG knowledge base
without rebuilding everything from scratch.

Usage:
    python3 add_alliance_docs.py
"""

import sys
import os
import time

# Add project root to path
sys.path.append(os.path.dirname(__file__))

from src.database.connection import DatabaseConnection
from src.services.knowledge_base_builder import KnowledgeBaseBuilder
from src.services.embedding_service import create_embedding_service
from config import Config
import json


def check_existing_alliance_docs():
    """Check if alliance documents already exist."""
    conn = None
    cursor = None
    try:
        DatabaseConnection.get_pool()
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT COUNT(*) as count
            FROM documents
            WHERE doc_type = 'alliance_info'
        """)

        result = cursor.fetchone()
        return result['count'] if result else 0

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def add_alliance_documents():
    """Add alliance documents to the knowledge base."""
    print("\n" + "=" * 60)
    print("Adding Airline Alliance Documents to Knowledge Base")
    print("=" * 60)

    # Check database connection
    try:
        DatabaseConnection.get_pool()
        conn = DatabaseConnection.get_connection()
        conn.close()
        print("✓ Database connection successful")
    except Exception as e:
        print(f"✗ Database connection failed: {str(e)}")
        print("\nPlease ensure:")
        print("  1. MariaDB is running")
        print("  2. Database credentials in .env are correct")
        print("  3. Database has been initialized")
        sys.exit(1)

    # Check for existing alliance documents
    print("\nChecking for existing alliance documents...")
    existing_count = check_existing_alliance_docs()

    if existing_count > 0:
        print(f"⚠ Found {existing_count} existing alliance documents")
        response = input("Do you want to delete them and add new ones? (y/n): ")
        if response.lower() != 'y':
            print("Aborted.")
            sys.exit(0)

        # Delete existing alliance documents
        print("Deleting existing alliance documents...")
        conn = None
        cursor = None
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor()

            # Delete embeddings first (foreign key constraint)
            cursor.execute("""
                DELETE e FROM embeddings e
                JOIN documents d ON e.doc_id = d.doc_id
                WHERE d.doc_type = 'alliance_info'
            """)

            # Delete documents
            cursor.execute("DELETE FROM documents WHERE doc_type = 'alliance_info'")
            conn.commit()
            print(f"✓ Deleted {existing_count} old alliance documents")

        except Exception as e:
            if conn:
                conn.rollback()
            print(f"✗ Error deleting old documents: {str(e)}")
            sys.exit(1)
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    # Build alliance documents
    print("\nBuilding alliance documents...")
    try:
        builder = KnowledgeBaseBuilder()
        alliance_docs = builder.build_alliance_documents()

        print(f"✓ Generated {len(alliance_docs)} alliance documents")

        # Insert documents
        print("Inserting documents into database...")
        doc_ids = builder.insert_documents(alliance_docs)
        print(f"✓ Inserted {len(doc_ids)} documents")

    except Exception as e:
        print(f"✗ Failed to build/insert alliance documents: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    # Generate embeddings
    print("\nGenerating embeddings for alliance documents...")
    try:
        embedding_service = create_embedding_service(provider=Config.EMBEDDING_PROVIDER)
        model_info = embedding_service.get_model_info()

        print(f"Embedding model: {model_info['model_name']}")
        print(f"Vector dimensions: {model_info['vector_dimensions']}")

        # Get alliance documents without embeddings
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT d.doc_id, d.title, d.content
            FROM documents d
            LEFT JOIN embeddings e ON d.doc_id = e.doc_id
            WHERE d.doc_type = 'alliance_info' AND e.embedding_id IS NULL
        """)

        documents = cursor.fetchall()

        if len(documents) == 0:
            print("✓ All alliance documents already have embeddings!")
        else:
            print(f"Generating embeddings for {len(documents)} documents...")
            start_time = time.time()

            # Extract texts
            texts = [f"{doc['title']}\n\n{doc['content']}" for doc in documents]

            # Generate embeddings
            embeddings = embedding_service.batch_generate_embeddings(texts, batch_size=len(texts))

            # Insert into database
            for doc, embedding in zip(documents, embeddings):
                cursor.execute("""
                    INSERT INTO embeddings (doc_id, embedding_vector, model_name, vector_dimensions)
                    VALUES (%s, %s, %s, %s)
                """, [
                    doc['doc_id'],
                    json.dumps(embedding),
                    model_info['model_name'],
                    model_info['vector_dimensions']
                ])

            conn.commit()

            elapsed_time = time.time() - start_time
            print(f"✓ Generated {len(documents)} embeddings in {elapsed_time:.2f} seconds")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"✗ Embedding generation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    # Final summary
    print("\n" + "=" * 60)
    print("✓ ALLIANCE DOCUMENTS ADDED SUCCESSFULLY!")
    print("=" * 60)
    print("\nYour RAG knowledge base now includes comprehensive")
    print("airline alliance information covering:")
    print("  - Star Alliance")
    print("  - OneWorld Alliance")
    print("  - SkyTeam Alliance")
    print("  - Alliance impact on route networks")
    print("  - Codeshare agreements and partnerships")
    print("  - Hub-and-spoke network coordination")
    print("\nYou can now query about airline alliances!")
    print('Example: "How do airline alliances affect route networks?"')


if __name__ == '__main__':
    add_alliance_documents()
