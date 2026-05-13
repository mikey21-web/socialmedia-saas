---
name: crewai
description: Build multi-agent AI systems with CrewAI. Use when creating AI agent crews, defining agent roles/tasks, implementing sequential or hierarchical workflows, building autonomous agent pipelines, or orchestrating multiple specialized AI agents.
---

# CrewAI Expert Guide

## Concepts

- **Agent**: A specialized AI worker with a role, goal, and backstory
- **Task**: A specific assignment for an agent with clear expected output
- **Crew**: A team of agents working together on related tasks
- **Process**: How agents collaborate (sequential, hierarchical)

## Setup

```bash
pip install crewai crewai-tools
```

## Basic Crew

```python
from crewai import Agent, Task, Crew, Process
from crewai_tools import SerperDevTool, WebsiteSearchTool
from langchain_openai import ChatOpenAI

# Tools
search_tool = SerperDevTool()
web_tool = WebsiteSearchTool()

llm = ChatOpenAI(model="gpt-4o", temperature=0.1)

# Agents
researcher = Agent(
    role="Senior Research Analyst",
    goal="Uncover cutting-edge developments in {topic}",
    backstory="""You're an experienced analyst at a leading tech think tank.
    Known for insightful, accurate research and clear communication.
    You find primary sources and verify claims.""",
    tools=[search_tool, web_tool],
    llm=llm,
    verbose=True,
    allow_delegation=False,  # can it delegate to others?
    max_iter=5,              # max tool call iterations
)

writer = Agent(
    role="Tech Content Strategist",
    goal="Create compelling, accurate content about {topic}",
    backstory="""You excel at turning complex technical concepts into
    engaging narratives. Known for rigorous fact-checking and clear prose.""",
    llm=llm,
    verbose=True,
)

# Tasks
research_task = Task(
    description="""Research {topic}. Find:
    1. Latest developments and breakthroughs (past 6 months)
    2. Key players and organizations
    3. Potential applications and impact
    4. Challenges and limitations
    Include sources for key claims.""",
    expected_output="Detailed research report with sources, 500+ words",
    agent=researcher,
)

writing_task = Task(
    description="""Write a comprehensive blog post about {topic} based on the research.
    Include: engaging intro, key developments, real-world impact, future outlook.
    Maintain accuracy. Cite research where appropriate.""",
    expected_output="Polished blog post, 800-1200 words, ready to publish",
    agent=writer,
    context=[research_task],  # depends on research_task output
)

# Crew
crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, writing_task],
    process=Process.sequential,  # or hierarchical
    verbose=True,
    memory=True,               # enable cross-task memory
)

# Run
result = crew.kickoff(inputs={"topic": "AI agents in production"})
print(result.raw)
```

## Hierarchical Process (Manager Agent)

```python
manager = Agent(
    role="Project Manager",
    goal="Coordinate the team to produce excellent deliverables",
    backstory="Experienced project manager who assigns work and ensures quality.",
    llm=ChatOpenAI(model="gpt-4o"),
    allow_delegation=True,  # REQUIRED for manager
)

crew = Crew(
    agents=[researcher, writer, editor],
    tasks=[research_task, writing_task, editing_task],
    process=Process.hierarchical,
    manager_agent=manager,  # or manager_llm=llm
    verbose=True,
)
```

## Custom Tools

```python
from crewai_tools import BaseTool
from pydantic import BaseModel, Field

class DatabaseQueryInput(BaseModel):
    table: str = Field(description="Table name to query")
    filters: dict = Field(default={}, description="Filter conditions")
    limit: int = Field(default=10, description="Max rows to return")

class DatabaseTool(BaseTool):
    name: str = "Database Query"
    description: str = """Query the internal database for structured data.
    Use when you need to look up records, statistics, or structured information."""

    def _run(self, table: str, filters: dict = {}, limit: int = 10) -> str:
        try:
            rows = db.query(table, filters, limit)
            return f"Found {len(rows)} rows:\n{json.dumps(rows, indent=2)}"
        except Exception as e:
            return f"Query failed: {str(e)}"

db_tool = DatabaseTool()

# Use in agent
analyst = Agent(
    role="Data Analyst",
    goal="Analyze business data and provide insights",
    backstory="Expert data analyst with deep knowledge of our data models.",
    tools=[db_tool],
    llm=llm,
)
```

## Output Parsing (Structured)

```python
from pydantic import BaseModel
from typing import List

class ResearchReport(BaseModel):
    title: str
    summary: str
    key_findings: List[str]
    sources: List[str]
    confidence_score: float

research_task = Task(
    description="Research {topic} and provide a structured report.",
    expected_output="A structured research report",
    agent=researcher,
    output_pydantic=ResearchReport,  # structured output
)

result = crew.kickoff(inputs={"topic": "RAG systems"})
report: ResearchReport = research_task.output.pydantic
print(report.key_findings)
```

## Multi-Crew Pipeline

```python
# Crew 1: Research
research_crew = Crew(agents=[researcher], tasks=[research_task], process=Process.sequential)
research_result = research_crew.kickoff(inputs={"topic": topic})

# Crew 2: Writing (uses research output)
writing_crew = Crew(agents=[writer, editor], tasks=[writing_task, editing_task])
final_result = writing_crew.kickoff(inputs={
    "topic": topic,
    "research": research_result.raw,
})
```

## Best Practices

```python
# 1. Specific roles + backstories = better performance
# ❌ Vague: role="AI Assistant"
# ✅ Specific: role="Senior Financial Analyst specializing in emerging markets"

# 2. Precise expected_output makes agents more reliable
# ❌ Vague: expected_output="A report"
# ✅ Specific: expected_output="500-word report with: executive summary, 3-5 key findings with supporting data, recommended actions, risk assessment"

# 3. Context dependencies prevent information loss
research_task = Task(description="Research X", agent=researcher)
write_task = Task(description="Write about X", agent=writer, context=[research_task])

# 4. Use allow_delegation=False to prevent agent "escaping" its scope

# 5. Set max_iter to prevent infinite tool-calling loops
agent = Agent(role="...", max_iter=3, max_rpm=10)  # 10 requests/min to LLM
```
