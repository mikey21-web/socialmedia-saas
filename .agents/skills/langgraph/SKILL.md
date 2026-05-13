---
name: langgraph
description: Build stateful multi-agent workflows with LangGraph. Use when implementing agentic loops, building agents with tool use and memory, creating multi-agent coordination patterns, implementing human-in-the-loop, or building complex LLM workflows with conditional branching.
---

# LangGraph Expert Guide

LangGraph builds stateful, graph-based LLM applications. Nodes = processing steps. Edges = flow control.

## Setup

```bash
pip install langgraph langchain-openai
```

## Core Concepts

```
StateGraph → defines state schema + nodes + edges
State → TypedDict shared between all nodes
Nodes → Python functions that read/modify state
Edges → connect nodes (normal or conditional)
```

## Basic Agent (ReAct pattern)

```python
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, BaseMessage
from langchain.tools import tool
from typing import TypedDict, Annotated
import operator

# Define state
class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], operator.add]  # append-only list

# Define tools
@tool
def search_web(query: str) -> str:
    """Search the internet for information."""
    return f"Search results for '{query}': [relevant info here]"

@tool
def calculate(expression: str) -> str:
    """Evaluate a math expression."""
    return str(eval(expression))

tools = [search_web, calculate]

# LLM with tools bound
model = ChatOpenAI(model="gpt-4o").bind_tools(tools)

# Agent node
def call_model(state: AgentState) -> AgentState:
    response = model.invoke(state["messages"])
    return {"messages": [response]}

# Build graph
workflow = StateGraph(AgentState)
workflow.add_node("agent", call_model)
workflow.add_node("tools", ToolNode(tools))  # handles tool execution

workflow.set_entry_point("agent")

# Conditional edge: if model wants tools, go to tools; else end
workflow.add_conditional_edges(
    "agent",
    tools_condition,  # checks if last message has tool_calls
)
# After tools, always go back to agent
workflow.add_edge("tools", "agent")

app = workflow.compile()

# Run
result = app.invoke({
    "messages": [HumanMessage(content="What's 123 * 456?")]
})
print(result["messages"][-1].content)
```

## Stateful Multi-Step Workflow

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Optional

class ResearchState(TypedDict):
    topic: str
    search_queries: List[str]
    raw_results: List[str]
    analysis: Optional[str]
    final_report: Optional[str]
    iteration: int

def generate_queries(state: ResearchState) -> ResearchState:
    """Generate search queries for the topic."""
    response = llm.invoke(f"Generate 3 search queries for: {state['topic']}")
    queries = response.content.split('\n')
    return {"search_queries": queries, "iteration": state["iteration"] + 1}

def search(state: ResearchState) -> ResearchState:
    """Execute searches."""
    results = []
    for query in state["search_queries"]:
        result = search_tool.run(query)
        results.append(result)
    return {"raw_results": results}

def analyze(state: ResearchState) -> ResearchState:
    """Analyze search results."""
    context = "\n".join(state["raw_results"])
    response = llm.invoke(f"Analyze these results about {state['topic']}:\n{context}")
    return {"analysis": response.content}

def write_report(state: ResearchState) -> ResearchState:
    """Write final report."""
    response = llm.invoke(f"Write a report based on:\n{state['analysis']}")
    return {"final_report": response.content}

def should_iterate(state: ResearchState) -> str:
    """Decide whether to iterate or write report."""
    if state["iteration"] < 2 and "insufficient" in (state.get("analysis") or "").lower():
        return "search_more"
    return "write_report"

# Build graph
workflow = StateGraph(ResearchState)
workflow.add_node("generate_queries", generate_queries)
workflow.add_node("search", search)
workflow.add_node("analyze", analyze)
workflow.add_node("write_report", write_report)

workflow.set_entry_point("generate_queries")
workflow.add_edge("generate_queries", "search")
workflow.add_edge("search", "analyze")
workflow.add_conditional_edges("analyze", should_iterate, {
    "search_more": "generate_queries",
    "write_report": "write_report",
})
workflow.add_edge("write_report", END)

app = workflow.compile()
result = app.invoke({"topic": "AI agents in 2025", "iteration": 0, "search_queries": [], "raw_results": []})
```

## Persistence (Checkpoints)

```python
from langgraph.checkpoint.memory import MemorySaver
# or: from langgraph.checkpoint.sqlite import SqliteSaver

memory = MemorySaver()
app = workflow.compile(checkpointer=memory)

# Thread ID = conversation/session ID
config = {"configurable": {"thread_id": "user-123-session-1"}}

# Invoke (state is persisted between calls)
result1 = app.invoke({"messages": [HumanMessage("Hi, I'm Alice")]}, config)
result2 = app.invoke({"messages": [HumanMessage("What's my name?")]}, config)
# result2 will remember "Alice"

# Get current state
state = app.get_state(config)
print(state.values)
```

## Human-in-the-Loop

```python
from langgraph.types import interrupt

def review_step(state: State) -> State:
    """Pause for human review."""
    human_feedback = interrupt({
        "action_to_review": state["proposed_action"],
        "reason": "This action has irreversible consequences",
    })
    return {"approved": human_feedback["approved"], "notes": human_feedback.get("notes")}

def should_proceed(state: State) -> str:
    return "execute" if state.get("approved") else "reject"

app = workflow.compile(interrupt_before=["review_step"])  # pause before this node

# Run until interrupt
result = app.invoke(initial_state, config)
# result.next == ["review_step"] → paused!

# Resume with human input
app.invoke(
    Command(resume={"approved": True, "notes": "Looks good"}),
    config
)
```

## Parallel Branches

```python
from langgraph.graph import StateGraph
from typing import TypedDict, Annotated
import operator

class ParallelState(TypedDict):
    input: str
    branch_a_result: Optional[str]
    branch_b_result: Optional[str]
    final: Optional[str]

def branch_a(state): return {"branch_a_result": process_a(state["input"])}
def branch_b(state): return {"branch_b_result": process_b(state["input"])}
def merge(state): return {"final": f"{state['branch_a_result']} + {state['branch_b_result']}"}

workflow = StateGraph(ParallelState)
workflow.add_node("a", branch_a)
workflow.add_node("b", branch_b)
workflow.add_node("merge", merge)

workflow.set_entry_point("a")   # Start: trigger both branches
workflow.add_edge("__start__", "a")
workflow.add_edge("__start__", "b")
workflow.add_edge("a", "merge")
workflow.add_edge("b", "merge")
workflow.add_edge("merge", END)
```
