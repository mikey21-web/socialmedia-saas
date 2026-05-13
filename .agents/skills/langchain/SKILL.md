---
name: langchain
description: Build LLM applications with LangChain (Python or JS). Use when creating chains, agents, RAG pipelines, using LangChain tools/retrievers, implementing memory, or building complex LLM workflows with LangChain.
---

# LangChain Expert Guide

## Python Setup

```bash
pip install langchain langchain-openai langchain-anthropic langchain-community
# For vector stores:
pip install langchain-chroma chromadb
# For document loaders:
pip install langchain-community pypdf
```

## Core Concepts

```
LangChain components:
- LLMs / Chat Models      → the AI model
- Prompts / Templates     → structured inputs
- Chains                  → sequences of components
- Agents                  → LLM + tools + reasoning loop
- Tools                   → functions the agent can call
- Retrievers / VectorStore → RAG components
- Memory                  → conversation history
```

## Basic Chain (LCEL - LangChain Expression Language)

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

model = ChatOpenAI(model="gpt-4o-mini", temperature=0)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant that {role}."),
    ("user", "{question}"),
])

chain = prompt | model | StrOutputParser()

# Invoke
result = chain.invoke({"role": "summarizes text", "question": "What is LangChain?"})

# Stream
for chunk in chain.stream({"role": "answers questions", "question": "Tell me about Python"}):
    print(chunk, end="", flush=True)

# Batch
results = chain.batch([
    {"role": "translates", "question": "Hello"},
    {"role": "translates", "question": "Goodbye"},
])
```

## Structured Output

```python
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_anthropic import ChatAnthropic

class Analysis(BaseModel):
    sentiment: str = Field(description="positive, negative, or neutral")
    confidence: float = Field(description="0.0 to 1.0")
    key_points: list[str] = Field(description="main points extracted")

model = ChatAnthropic(model="Codex-sonnet-4-6")
structured_model = model.with_structured_output(Analysis)

result = structured_model.invoke("Analyze: 'The product is amazing, highly recommend!'")
print(result.sentiment, result.confidence)
```

## RAG Pipeline

```python
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain

# 1. Load documents
loader = DirectoryLoader("./docs", glob="*.pdf", loader_cls=PyPDFLoader)
docs = loader.load()

# 2. Split
splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
chunks = splitter.split_documents(docs)

# 3. Embed & store
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(chunks, embeddings, persist_directory="./chroma_db")

# 4. Retriever
retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

# 5. Chain
llm = ChatOpenAI(model="gpt-4o")
prompt = ChatPromptTemplate.from_template("""
Answer based on context only. If not in context, say "I don't know."

Context: {context}
Question: {input}
""")

doc_chain = create_stuff_documents_chain(llm, prompt)
rag_chain = create_retrieval_chain(retriever, doc_chain)

result = rag_chain.invoke({"input": "What is the refund policy?"})
print(result["answer"])
```

## Agent with Tools

```python
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain.tools import tool
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

@tool
def search_web(query: str) -> str:
    """Search the web for current information about a topic."""
    # Your search implementation
    return f"Search results for: {query}"

@tool
def calculate(expression: str) -> str:
    """Evaluate a mathematical expression. Input: math expression as string."""
    try:
        return str(eval(expression))
    except:
        return "Error: invalid expression"

tools = [search_web, calculate]

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant with access to tools."),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

llm = ChatOpenAI(model="gpt-4o")
agent = create_tool_calling_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True, max_iterations=5)

result = executor.invoke({"input": "What's 523 * 847, and then search for that number's significance?"})
```

## Memory / Conversation History

```python
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

model = ChatOpenAI(model="gpt-4o")
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant."),
    ("placeholder", "{chat_history}"),
    ("human", "{input}"),
])

chain = prompt | model | StrOutputParser()

# Store for multiple sessions
store = {}
def get_session_history(session_id: str):
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]

chain_with_history = RunnableWithMessageHistory(
    chain,
    get_session_history,
    input_messages_key="input",
    history_messages_key="chat_history",
)

# Use with session
chain_with_history.invoke(
    {"input": "My name is Alice"},
    config={"configurable": {"session_id": "user_123"}},
)
chain_with_history.invoke(
    {"input": "What's my name?"},
    config={"configurable": {"session_id": "user_123"}},
)  # Returns "Your name is Alice"
```

## Text Splitting Best Practices

```python
# For most text
RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

# For code
from langchain.text_splitter import Language, RecursiveCharacterTextSplitter
splitter = RecursiveCharacterTextSplitter.from_language(
    language=Language.PYTHON, chunk_size=2000, chunk_overlap=200
)

# For markdown
from langchain.text_splitter import MarkdownTextSplitter
splitter = MarkdownTextSplitter(chunk_size=1000)
```

## JavaScript/TypeScript

```typescript
import { ChatOpenAI } from "@langchain/openai"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"

const model = new ChatOpenAI({ modelName: "gpt-4o-mini" })
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant."],
  ["human", "{question}"],
])
const chain = prompt.pipe(model).pipe(new StringOutputParser())
const result = await chain.invoke({ question: "What is TypeScript?" })
```
