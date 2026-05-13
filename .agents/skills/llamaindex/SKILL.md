---
name: llamaindex
description: Build RAG and data-aware LLM applications with LlamaIndex. Use when building RAG pipelines, indexing documents, querying knowledge bases, implementing agents with tools, or building data-aware LLM applications with LlamaIndex (Python or TypeScript).
---

# LlamaIndex Expert Guide

## Python Setup

```bash
pip install llama-index llama-index-llms-openai llama-index-embeddings-openai
# Vector stores:
pip install llama-index-vector-stores-chroma chromadb
pip install llama-index-vector-stores-pinecone pinecone-client
```

## Simple RAG Pipeline

```python
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, Settings
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding

# Configure globally
Settings.llm = OpenAI(model="gpt-4o", temperature=0.1)
Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")

# 1. Load documents
documents = SimpleDirectoryReader("./docs").load_data()
# or from specific files:
documents = SimpleDirectoryReader(input_files=["doc1.pdf", "doc2.txt"]).load_data()

# 2. Build index
index = VectorStoreIndex.from_documents(documents)

# 3. Query
query_engine = index.as_query_engine(similarity_top_k=5)
response = query_engine.query("What is the refund policy?")
print(response.response)
print(response.source_nodes)  # see which chunks answered
```

## Persistent Index (ChromaDB)

```python
import chromadb
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore

# Setup persistent store
chroma_client = chromadb.PersistentClient(path="./chroma_db")
chroma_collection = chroma_client.get_or_create_collection("my_docs")
vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
storage_context = StorageContext.from_defaults(vector_store=vector_store)

# First time: build and save
index = VectorStoreIndex.from_documents(
    documents,
    storage_context=storage_context,
)

# Subsequent times: load existing
index = VectorStoreIndex.from_vector_store(vector_store)
```

## Document Loaders

```python
from llama_index.core import SimpleDirectoryReader
from llama_index.readers.web import SimpleWebPageReader
from llama_index.readers.github import GithubRepositoryReader
from llama_index.readers.notion import NotionPageReader

# Directory (auto-detects PDF, DOCX, TXT, MD, etc.)
docs = SimpleDirectoryReader("./data", recursive=True).load_data()

# Web pages
docs = SimpleWebPageReader().load_data(["https://example.com/docs"])

# Single PDF
from llama_index.readers.file import PDFReader
docs = PDFReader().load_data(file="report.pdf")
```

## Node Parsing (Chunking)

```python
from llama_index.core.node_parser import (
    SentenceSplitter,       # default, good for most text
    SemanticSplitterNodeParser,  # smart semantic boundaries
    MarkdownNodeParser,     # markdown-aware
    CodeSplitter,           # for code files
)

# Default sentence splitter
parser = SentenceSplitter(chunk_size=1024, chunk_overlap=200)

# Semantic splitter (uses embeddings for smart breaks)
from llama_index.embeddings.openai import OpenAIEmbedding
parser = SemanticSplitterNodeParser(
    buffer_size=1,
    breakpoint_percentile_threshold=95,
    embed_model=OpenAIEmbedding(),
)

nodes = parser.get_nodes_from_documents(documents)
```

## Query Engine Configurations

```python
# Basic
query_engine = index.as_query_engine(
    similarity_top_k=5,
    response_mode="compact",   # compact, refine, tree_summarize
)

# With filters
from llama_index.core.vector_stores import MetadataFilter, FilterOperator
query_engine = index.as_query_engine(
    filters=MetadataFilters(filters=[
        MetadataFilter(key="category", value="technical", operator=FilterOperator.EQ),
    ])
)

# Streaming
query_engine = index.as_query_engine(streaming=True)
streaming_response = query_engine.query("Explain authentication")
for token in streaming_response.response_gen:
    print(token, end="", flush=True)
```

## Chat Engine (Conversational)

```python
# Stateful chat with memory
chat_engine = index.as_chat_engine(
    chat_mode="condense_plus_context",  # best for most cases
    verbose=True,
)

response = chat_engine.chat("What is the refund policy?")
response = chat_engine.chat("How long does it take?")  # uses context from first message
chat_engine.reset()  # clear history
```

## Agents with Tools

```python
from llama_index.core.agent import ReActAgent
from llama_index.core.tools import QueryEngineTool, FunctionTool
from llama_index.tools.yahoo_finance import YahooFinanceToolSpec

# Tool from query engine (RAG)
rag_tool = QueryEngineTool.from_defaults(
    query_engine=query_engine,
    name="company_docs",
    description="Search company documentation and policies",
)

# Custom function tool
def get_current_date() -> str:
    """Returns today's date."""
    from datetime import date
    return date.today().isoformat()

date_tool = FunctionTool.from_defaults(fn=get_current_date)

# Create agent
agent = ReActAgent.from_tools(
    [rag_tool, date_tool],
    llm=OpenAI(model="gpt-4o"),
    verbose=True,
    max_iterations=10,
)

response = agent.chat("What are the current refund policies and what is today's date?")
```

## TypeScript / JavaScript

```typescript
import { Document, VectorStoreIndex, SimpleDirectoryReader } from 'llamaindex'

// Simple RAG
const documents = await new SimpleDirectoryReader('./data').loadData()
const index = await VectorStoreIndex.fromDocuments(documents)
const queryEngine = index.asQueryEngine()

const response = await queryEngine.query({ query: 'What is the return policy?' })
console.log(response.message.content)
```

## Metadata Extraction (Auto-tagging)

```python
from llama_index.core.extractors import (
    TitleExtractor, KeywordExtractor, SummaryExtractor
)
from llama_index.core.ingestion import IngestionPipeline

pipeline = IngestionPipeline(
    transformations=[
        SentenceSplitter(chunk_size=1024),
        TitleExtractor(nodes=5),
        KeywordExtractor(keywords=10),
        OpenAIEmbedding(),
    ]
)

nodes = await pipeline.arun(documents=documents)
```
