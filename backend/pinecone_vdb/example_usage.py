"""
Example usage of the Vector Search Engine.
This demonstrates various ways to use the search functionality.
"""

from vector_search import VectorSearchEngine, quick_search, search_and_format


def example_1_basic_search():
    """Example 1: Basic semantic search"""
    print("\n" + "="*70)
    print("Example 1: Basic Semantic Search")
    print("="*70)
    
    engine = VectorSearchEngine()
    results = engine.semantic_search("organic oranges", top_k=3)
    
    print(f"\nFound {len(results)} results for 'organic oranges':\n")
    for i, result in enumerate(results, 1):
        print(f"{i}. {result.item_name}")
        print(f"   Category: {result.category}")
        print(f"   Aisle: {result.aisle_location}")
        print(f"   Score: {result.score:.4f}")
        print(f"   Description: {result.description}\n")


def example_2_filtered_search():
    """Example 2: Search with category filter"""
    print("\n" + "="*70)
    print("Example 2: Search with Category Filter")
    print("="*70)
    
    engine = VectorSearchEngine()
    results = engine.search_with_filter(
        query="cheese",
        category="Dairy",
        top_k=5
    )
    
    print(f"\nFound {len(results)} cheese products in Dairy:\n")
    for result in results:
        print(f"• {result.item_name} (Aisle {result.aisle_location})")


def example_3_reranking():
    """Example 3: Search with reranking for better accuracy"""
    print("\n" + "="*70)
    print("Example 3: Search with Reranking")
    print("="*70)
    
    engine = VectorSearchEngine()
    
    # Compare regular search vs reranked search
    query = "ingredients for a healthy breakfast"
    
    print(f"\nQuery: '{query}'")
    print("\nRegular search (top 3):")
    regular_results = engine.semantic_search(query, top_k=3)
    for i, result in enumerate(regular_results, 1):
        print(f"{i}. {result.item_name} (Score: {result.score:.4f})")
    
    print("\nReranked search (top 3):")
    reranked_results = engine.search_with_reranking(
        query=query,
        top_k=20,  # Retrieve more candidates
        top_n=3    # Return top 3 after reranking
    )
    for i, result in enumerate(reranked_results, 1):
        print(f"{i}. {result.item_name} (Score: {result.score:.4f})")


def example_4_category_browse():
    """Example 4: Browse products by category"""
    print("\n" + "="*70)
    print("Example 4: Browse Products by Category")
    print("="*70)
    
    engine = VectorSearchEngine()
    
    # Browse Produce section
    results = engine.search_by_category("Produce", top_k=5)
    
    print("\nTop 5 products in Produce:\n")
    for result in results:
        print(f"• {result.item_name} - {result.description}")


def example_5_aisle_search():
    """Example 5: Search within a specific aisle"""
    print("\n" + "="*70)
    print("Example 5: Search within Specific Aisle")
    print("="*70)
    
    engine = VectorSearchEngine()
    
    # What's in aisle A1?
    results = engine.search_by_aisle("A1", top_k=10)
    
    print("\nProducts in Aisle A1:\n")
    for result in results:
        print(f"• {result.item_name}")


def example_6_multi_query():
    """Example 6: Multi-query search for complex needs"""
    print("\n" + "="*70)
    print("Example 6: Multi-Query Search")
    print("="*70)
    
    engine = VectorSearchEngine()
    
    # User wants to make tacos
    queries = [
        "tortillas",
        "ground beef or chicken",
        "cheese for tacos",
        "taco toppings like lettuce tomatoes"
    ]
    
    results = engine.multi_query_search(queries, top_k_per_query=2)
    
    print("\nIngredients for tacos:\n")
    for result in results[:10]:  # Show top 10
        print(f"• {result.item_name} (Aisle {result.aisle_location})")


def example_7_recommendations():
    """Example 7: Product recommendations"""
    print("\n" + "="*70)
    print("Example 7: Product Recommendations")
    print("="*70)
    
    engine = VectorSearchEngine()
    
    # Find products similar to "Organic Bananas"
    results = engine.get_product_recommendations("Organic Bananas", top_k=5)
    
    print("\nProducts similar to 'Organic Bananas':\n")
    for result in results:
        print(f"• {result.item_name} ({result.category})")


def example_8_formatted_response():
    """Example 8: Get formatted response for AI agent"""
    print("\n" + "="*70)
    print("Example 8: Formatted Response for AI Agent")
    print("="*70)
    
    engine = VectorSearchEngine()
    results = engine.search_with_reranking("fresh fruit", top_k=15, top_n=3)
    
    # Format for AI agent
    response = engine.format_results_for_agent(results)
    
    print(f"\nUser asks: 'Do you have any fresh fruit?'")
    print(f"\nAgent responds:\n{response}")


def example_9_quick_functions():
    """Example 9: Use quick convenience functions"""
    print("\n" + "="*70)
    print("Example 9: Quick Convenience Functions")
    print("="*70)
    
    # Quick search without initializing engine
    print("\nUsing quick_search():")
    results = quick_search("chocolate", top_k=3)
    for result in results:
        print(f"• {result.item_name}")
    
    # Quick search with formatted response
    print("\nUsing search_and_format():")
    response = search_and_format("pasta sauce", top_k=3)
    print(response)


def example_10_result_manipulation():
    """Example 10: Working with SearchResult objects"""
    print("\n" + "="*70)
    print("Example 10: Working with SearchResult Objects")
    print("="*70)
    
    engine = VectorSearchEngine()
    results = engine.semantic_search("snacks", top_k=5)
    
    # Convert to dictionary
    print("\nAs dictionaries:")
    for result in results[:2]:
        print(result.to_dict())
    
    # Convert to natural language
    print("\nAs natural language:")
    for result in results[:2]:
        print(f"• {result.to_natural_language()}")


def example_11_minimum_score():
    """Example 11: Filter by minimum score"""
    print("\n" + "="*70)
    print("Example 11: Filter by Minimum Score")
    print("="*70)
    
    engine = VectorSearchEngine()
    
    # Only return results with score >= 0.7
    results = engine.semantic_search(
        "ice cream",
        top_k=10,
        min_score=0.7
    )
    
    print(f"\nHigh-quality matches for 'ice cream' (score >= 0.7):\n")
    for result in results:
        print(f"• {result.item_name} (Score: {result.score:.4f})")


def example_12_index_stats():
    """Example 12: Get index statistics"""
    print("\n" + "="*70)
    print("Example 12: Index Statistics")
    print("="*70)
    
    engine = VectorSearchEngine()
    stats = engine.get_index_stats()
    
    print("\nIndex Statistics:")
    print(f"  Total Products: {stats['total_vectors']}")
    print(f"  Vector Dimension: {stats['dimension']}")
    print(f"  Similarity Metric: {stats['metric']}")
    print(f"  Namespaces: {list(stats['namespaces'].keys())}")


def main():
    """Run all examples"""
    print("\n" + "="*70)
    print("  🧪 Vector Search Engine - Example Usage")
    print("="*70)
    
    examples = [
        example_1_basic_search,
        example_2_filtered_search,
        example_3_reranking,
        example_4_category_browse,
        example_5_aisle_search,
        example_6_multi_query,
        example_7_recommendations,
        example_8_formatted_response,
        example_9_quick_functions,
        example_10_result_manipulation,
        example_11_minimum_score,
        example_12_index_stats
    ]
    
    try:
        for i, example in enumerate(examples, 1):
            example()
            
            if i < len(examples):
                input("\nPress Enter to continue to next example...")
        
        print("\n" + "="*70)
        print("  ✅ All Examples Completed!")
        print("="*70 + "\n")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Examples interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error running examples: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()

