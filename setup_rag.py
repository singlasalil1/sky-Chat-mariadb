#!/usr/bin/env python3
"""
RAG Setup Script
================
This script initializes the RAG (Retrieval-Augmented Generation) system for SkyChat.

Steps:
1. Create RAG database tables
2. Build knowledge base from flight data
3. Generate embeddings for all documents

Usage:
    python setup_rag.py [options]

Options:
    --skip-schema     Skip database schema creation
    --skip-kb         Skip knowledge base building
    --skip-embeddings Skip embedding generation
    --airport-limit N  Limit number of airports (default: 500)
    --airline-limit N  Limit number of airlines (default: 300)
    --route-limit N    Limit number of routes (default: 1000)
    --provider PROVIDER  Embedding provider (openai, sentence-transformers, cohere)
"""

import sys
import os
import argparse
import time

# Add project root to path
sys.path.append(os.path.dirname(__file__))

from src.database.connection import DatabaseConnection
from src.services.knowledge_base_builder import KnowledgeBaseBuilder
from src.services.embedding_service import create_embedding_service
from config import Config


def run_sql_file(filepath):
    """Execute SQL file against the database."""
    print(f"\nExecuting SQL file: {filepath}")

    with open(filepath, 'r') as f:
        sql_content = f.read()

    # Split by statements (simple approach - may need refinement for complex SQL)
    statements = [s.strip() for s in sql_content.split(';') if s.strip()]

    conn = None
    cursor = None
    try:
        # Initialize connection pool
        DatabaseConnection.get_pool()
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()

        for i, statement in enumerate(statements, 1):
            if statement:
                print(f"  Executing statement {i}/{len(statements)}...")
                cursor.execute(statement)

        conn.commit()
        print(f"✓ Successfully executed {len(statements)} statements")

    except Exception as e:
        print(f"Error executing SQL: {e}")
        if conn:
            conn.rollback()
        raise

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def create_schema(args):
    """Create RAG database schema."""
    if args.skip_schema:
        print("\nSkipping schema creation (--skip-schema flag)")
        return

    print("\n" + "=" * 60)
    print("STEP 1: Creating RAG Database Schema")
    print("=" * 60)

    schema_file = os.path.join(
        os.path.dirname(__file__),
        'src', 'database', 'schema', '03_create_rag_tables.sql'
    )

    if not os.path.exists(schema_file):
        print(f"✗ Schema file not found: {schema_file}")
        return False

    try:
        run_sql_file(schema_file)
        return True
    except Exception as e:
        print(f"✗ Schema creation failed: {str(e)}")
        return False


def build_knowledge_base(args):
    """Build knowledge base from flight data."""
    if args.skip_kb:
        print("\nSkipping knowledge base building (--skip-kb flag)")
        return

    print("\n" + "=" * 60)
    print("STEP 2: Building Knowledge Base")
    print("=" * 60)

    try:
        builder = KnowledgeBaseBuilder()

        stats = builder.build_complete_knowledge_base(
            airport_limit=args.airport_limit,
            airline_limit=args.airline_limit,
            route_limit=args.route_limit
        )

        print(f"\n✓ Knowledge base built successfully!")
        print(f"  Total documents: {stats['total']}")

        return True

    except Exception as e:
        print(f"\n✗ Knowledge base building failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def generate_embeddings(args):
    """Generate embeddings for all documents."""
    if args.skip_embeddings:
        print("\nSkipping embedding generation (--skip-embeddings flag)")
        return

    print("\n" + "=" * 60)
    print("STEP 3: Generating Embeddings")
    print("=" * 60)

    try:
        # Initialize embedding service
        provider = args.provider or Config.EMBEDDING_PROVIDER
        print(f"\nInitializing embedding service with provider: {provider}")

        embedding_service = create_embedding_service(provider=provider)
        model_info = embedding_service.get_model_info()

        print(f"Model: {model_info['model_name']}")
        print(f"Dimensions: {model_info['vector_dimensions']}")

        # Get all documents without embeddings
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT d.doc_id, d.title, d.content
            FROM documents d
            LEFT JOIN embeddings e ON d.doc_id = e.doc_id
            WHERE e.embedding_id IS NULL
        """)

        documents = cursor.fetchall()
        total_docs = len(documents)

        if total_docs == 0:
            print("\n✓ All documents already have embeddings!")
            cursor.close()
            conn.close()
            return True

        print(f"\nGenerating embeddings for {total_docs} documents...")
        print("This may take a few minutes depending on the provider and number of documents.\n")

        start_time = time.time()

        # Process in batches
        batch_size = 100
        for i in range(0, total_docs, batch_size):
            batch = documents[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (total_docs + batch_size - 1) // batch_size

            print(f"Processing batch {batch_num}/{total_batches} ({len(batch)} documents)...")

            # Extract texts
            texts = [f"{doc['title']}\n\n{doc['content']}" for doc in batch]

            # Generate embeddings
            embeddings = embedding_service.batch_generate_embeddings(texts, batch_size=len(texts))

            # Insert into database
            for doc, embedding in zip(batch, embeddings):
                import json
                cursor.execute("""
                    INSERT INTO embeddings (doc_id, embedding_vector, model_name, vector_dimensions)
                    VALUES (?, ?, ?, ?)
                """, [
                    doc['doc_id'],
                    json.dumps(embedding),
                    model_info['model_name'],
                    model_info['vector_dimensions']
                ])

            conn.commit()

        elapsed_time = time.time() - start_time
        print(f"\n✓ Generated {total_docs} embeddings in {elapsed_time:.2f} seconds")
        print(f"  Average: {elapsed_time / total_docs:.2f} seconds per document")

        cursor.close()
        conn.close()

        return True

    except Exception as e:
        print(f"\n✗ Embedding generation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Main setup function."""
    parser = argparse.ArgumentParser(
        description='Initialize RAG system for SkyChat',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    parser.add_argument('--skip-schema', action='store_true',
                        help='Skip database schema creation')
    parser.add_argument('--skip-kb', action='store_true',
                        help='Skip knowledge base building')
    parser.add_argument('--skip-embeddings', action='store_true',
                        help='Skip embedding generation')
    parser.add_argument('--airport-limit', type=int, default=500,
                        help='Limit number of airports (default: 500)')
    parser.add_argument('--airline-limit', type=int, default=300,
                        help='Limit number of airlines (default: 300)')
    parser.add_argument('--route-limit', type=int, default=1000,
                        help='Limit number of routes (default: 1000)')
    parser.add_argument('--provider', type=str, choices=['openai', 'sentence-transformers', 'cohere'],
                        help='Embedding provider (overrides .env config)')

    args = parser.parse_args()

    print("\n" + "=" * 60)
    print("SkyChat RAG Setup")
    print("=" * 60)
    print("\nThis script will set up the RAG system for SkyChat.")
    print("It may take several minutes to complete.\n")

    # Check database connection
    try:
        # Initialize connection pool first
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
        print(f"  4. Error details: {str(e)}")
        sys.exit(1)

    # Run setup steps
    success = True

    if not args.skip_schema:
        success = create_schema(args) and success

    if not args.skip_kb:
        success = build_knowledge_base(args) and success

    if not args.skip_embeddings:
        success = generate_embeddings(args) and success

    # Final summary
    print("\n" + "=" * 60)
    if success:
        print("✓ RAG SETUP COMPLETE!")
        print("=" * 60)
        print("\nYour RAG system is ready to use!")
        print("\nNext steps:")
        print("  1. Set RAG_ENABLED=true in your .env file")
        print("  2. Configure your API keys (OPENAI_API_KEY, etc.)")
        print("  3. Start the Flask server: python app.py")
        print("  4. Query with RAG mode in the chat interface")
    else:
        print("✗ RAG SETUP FAILED")
        print("=" * 60)
        print("\nSome steps failed. Please check the errors above.")
        sys.exit(1)


if __name__ == '__main__':
    main()
