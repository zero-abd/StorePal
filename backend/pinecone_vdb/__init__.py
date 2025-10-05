"""
Pinecone integration for StorePal.
Provides vector search capabilities for WinMart inventory.
"""

from .vector_search import VectorSearchEngine, SearchResult, quick_search, search_and_format

__all__ = [
    'VectorSearchEngine',
    'SearchResult',
    'quick_search',
    'search_and_format'
]

