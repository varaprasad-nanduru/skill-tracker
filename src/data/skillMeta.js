// Computed difficulty from level + skill position
export function getSkillDifficulty(levelId, index, total) {
  const ratio = total > 1 ? index / (total - 1) : 0
  if (levelId === 'beginner') {
    if (ratio < 0.35) return 'easy'
    if (ratio < 0.72) return 'medium'
    return 'hard'
  }
  if (levelId === 'intermediate') {
    if (ratio < 0.33) return 'medium'
    return 'hard'
  }
  return 'hard'
}

export const DIFFICULTY_CONFIG = {
  easy:   { bg: '#10b98118', border: '#10b98140', text: '#10b981', label: 'Easy' },
  medium: { bg: '#f59e0b18', border: '#f59e0b40', text: '#f59e0b', label: 'Medium' },
  hard:   { bg: '#ef444418', border: '#ef444440', text: '#ef4444', label: 'Hard' },
}

export function getSkillTime(levelId, index, total) {
  const d = getSkillDifficulty(levelId, index, total)
  return d === 'easy' ? '~2h' : d === 'medium' ? '~4h' : '~8h'
}

// Code snippets keyed by roleId__levelId__skillIndex
export const CODE_SNIPPETS = {
  // ── AI Engineering · Beginner ──────────────────────────────────────────────
  'ai-engineering__beginner__0': `import anthropic

client = anthropic.Anthropic()   # reads ANTHROPIC_API_KEY from env

# Basic call — change temperature 0 → 1
msg = client.messages.create(
    model="claude-opus-4-5",
    max_tokens=1024,
    temperature=0.2,             # 0 = deterministic, 1 = creative
    system="You are a concise technical assistant.",
    messages=[{"role": "user", "content": "What is RAG in 2 sentences?"}],
)
print(msg.content[0].text)

# Streaming — tokens appear as they're generated
with client.messages.stream(
    model="claude-opus-4-5",
    max_tokens=512,
    messages=[{"role": "user", "content": "Explain embeddings"}],
) as stream:
    for token in stream.text_stream:
        print(token, end="", flush=True)`,

  'ai-engineering__beginner__1': `import anthropic, json

client = anthropic.Anthropic()

# Zero-shot
def zero_shot(text):
    return client.messages.create(
        model="claude-opus-4-5", max_tokens=128,
        messages=[{"role": "user", "content": f"Classify sentiment: {text}"}]
    ).content[0].text

# Few-shot — examples guide the output format
def few_shot(text):
    return client.messages.create(
        model="claude-opus-4-5", max_tokens=64,
        messages=[{"role": "user", "content": f"""Classify sentiment.
Examples:
"Great product!" → positive
"Terrible service" → negative
"It's okay" → neutral

Classify: "{text}" →"""}]
    ).content[0].text

# Chain-of-thought + JSON output
def structured_extract(invoice_text):
    resp = client.messages.create(
        model="claude-opus-4-5", max_tokens=512,
        messages=[{"role": "user", "content": f"""Extract fields. Think step by step, then return JSON.
Text: {invoice_text}
Format: {{"vendor":"","amount":0,"currency":"","date":""}}"""}]
    )
    return json.loads(resp.content[0].text)`,

  'ai-engineering__beginner__2': `from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import anthropic, json

app = FastAPI()
client = anthropic.Anthropic()

class ChatReq(BaseModel):
    message: str
    temperature: float = 0.7

@app.get("/health")
def health():
    return {"status": "ok", "model": "claude-opus-4-5"}

@app.post("/chat")
def chat(req: ChatReq):
    msg = client.messages.create(
        model="claude-opus-4-5", max_tokens=1024,
        temperature=req.temperature,
        messages=[{"role": "user", "content": req.message}],
    )
    return {"response": msg.content[0].text, "tokens": msg.usage.output_tokens}

@app.post("/stream")
def stream(req: ChatReq):
    def gen():
        with client.messages.stream(
            model="claude-opus-4-5", max_tokens=1024,
            messages=[{"role": "user", "content": req.message}],
        ) as s:
            for text in s.text_stream:
                yield f"data: {json.dumps({'token': text})}\\n\\n"
        yield "data: [DONE]\\n\\n"
    return StreamingResponse(gen(), media_type="text/event-stream")`,

  'ai-engineering__beginner__3': `import numpy as np
from openai import OpenAI   # Anthropic doesn't have an embeddings API yet

client = OpenAI()           # reads OPENAI_API_KEY

def embed(text: str) -> list[float]:
    return client.embeddings.create(
        input=text, model="text-embedding-3-small"
    ).data[0].embedding

def cosine_similarity(a, b) -> float:
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

# Semantic understanding demo
words = ["dog", "puppy", "cat", "finance", "banking"]
vecs  = {w: embed(w) for w in words}

print(f"dog ↔ puppy  : {cosine_similarity(vecs['dog'], vecs['puppy']):.3f}")  # ~0.87
print(f"dog ↔ cat    : {cosine_similarity(vecs['dog'], vecs['cat']):.3f}")    # ~0.73
print(f"dog ↔ finance: {cosine_similarity(vecs['dog'], vecs['finance']):.3f}")# ~0.18`,

  'ai-engineering__beginner__4': `import chromadb
from chromadb.utils import embedding_functions

# Persistent storage (use chromadb.Client() for in-memory)
chroma = chromadb.PersistentClient(path="./chroma_db")

ef = embedding_functions.OpenAIEmbeddingFunction(
    api_key="sk-...", model_name="text-embedding-3-small"
)
col = chroma.get_or_create_collection("docs", embedding_function=ef)

# Add 20 documents
docs = [
    "FastAPI is a modern Python web framework",
    "LangChain simplifies building LLM applications",
    "RAG combines retrieval with language model generation",
    # ... more docs
]
col.add(
    documents=docs,
    ids=[f"doc_{i}" for i in range(len(docs))],
    metadatas=[{"source": "manual", "idx": i} for i in range(len(docs))],
)

# Semantic search — returns most similar docs
results = col.query(
    query_texts=["how to build AI apps"],
    n_results=3,
    where={"source": "manual"},   # metadata filter
)
for doc, dist in zip(results["documents"][0], results["distances"][0]):
    print(f"[{dist:.3f}] {doc[:80]}")`,

  'ai-engineering__beginner__5': `import pypdf, chromadb, anthropic
from chromadb.utils import embedding_functions

def chunk_text(text: str, size=500, overlap=50) -> list[str]:
    return [text[i:i+size] for i in range(0, len(text), size - overlap)]

def build_rag_index(pdf_path: str):
    # 1. Extract text
    reader = pypdf.PdfReader(pdf_path)
    text = " ".join(p.extract_text() or "" for p in reader.pages)
    chunks = chunk_text(text)

    # 2. Embed + store
    ef = embedding_functions.OpenAIEmbeddingFunction(api_key="sk-...",
                                                      model_name="text-embedding-3-small")
    col = chromadb.PersistentClient("./db").get_or_create_collection("pdf", embedding_function=ef)
    col.add(documents=chunks, ids=[f"c{i}" for i in range(len(chunks))])
    return col

def rag_answer(question: str, col, llm=anthropic.Anthropic()) -> str:
    # 3. Retrieve top-3 relevant chunks
    hits = col.query(query_texts=[question], n_results=3)
    context = "\\n\\n---\\n\\n".join(hits["documents"][0])

    # 4. Generate grounded answer
    resp = llm.messages.create(
        model="claude-opus-4-5", max_tokens=1024,
        messages=[{"role": "user", "content":
            f"Answer using ONLY this context. Cite which section.\\n\\nContext:\\n{context}\\n\\nQuestion: {question}"}],
    )
    return resp.content[0].text`,

  'ai-engineering__beginner__6': `# Backend: FastAPI SSE endpoint
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import anthropic, json

app = FastAPI()
client = anthropic.Anthropic()

@app.post("/stream")
async def stream(body: dict):
    async def gen():
        with client.messages.stream(
            model="claude-opus-4-5", max_tokens=2048,
            messages=[{"role": "user", "content": body["message"]}],
        ) as s:
            for text in s.text_stream:
                yield f"data: {json.dumps({'token': text})}\\n\\n"
        yield "data: [DONE]\\n\\n"
    return StreamingResponse(gen(), media_type="text/event-stream")

# Frontend: consume SSE in React
"""
async function streamChat(message, onToken, onDone) {
  const res = await fetch('/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value).split('\\n')) {
      if (line.startsWith('data: ') && !line.includes('[DONE]'))
        onToken(JSON.parse(line.slice(6)).token);
    }
  }
  onDone();
}
"""`,

  'ai-engineering__beginner__7': `# railway.toml — zero-config deploy on Railway
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"

# Set secrets in Railway dashboard (never commit):
# ANTHROPIC_API_KEY, OPENAI_API_KEY, DATABASE_URL

# Vercel: deploy React frontend
# vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "env": {
    "VITE_API_URL": "https://your-api.railway.app"
  }
}

# .env.local (gitignored)
VITE_API_URL=http://localhost:8000`,

  // ── AI Engineering · Intermediate ──────────────────────────────────────────
  'ai-engineering__intermediate__0': `from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain.memory import ConversationBufferMemory
from langchain_core.pydantic_v1 import BaseModel, Field

llm = ChatAnthropic(model="claude-opus-4-5")

# Simple LCEL chain: prompt | llm | parser
chain = (
    ChatPromptTemplate.from_messages([
        ("system", "You are an expert in {domain}."),
        ("human", "{question}"),
    ])
    | llm
    | StrOutputParser()
)
print(chain.invoke({"domain": "Python", "question": "Explain decorators concisely"}))

# Structured output with Pydantic
class Sentiment(BaseModel):
    label: str = Field(description="positive | negative | neutral")
    score: float = Field(description="confidence 0.0-1.0")

structured = llm.with_structured_output(Sentiment)
result = structured.invoke("The product is absolutely amazing!")
print(result.label, result.score)

# Conversation memory
memory = ConversationBufferMemory(return_messages=True)
memory.chat_memory.add_user_message("My name is Alice")
memory.chat_memory.add_ai_message("Hi Alice!")
print(memory.load_memory_variables({}))`,

  'ai-engineering__intermediate__1': `from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_anthropic import ChatAnthropic
from typing import TypedDict, Annotated
import operator

class State(TypedDict):
    messages: Annotated[list, operator.add]
    iteration: int

llm = ChatAnthropic(model="claude-opus-4-5").bind_tools([search_tool, calc_tool])

def agent(state: State) -> State:
    response = llm.invoke(state["messages"])
    return {"messages": [response], "iteration": state["iteration"] + 1}

def tools(state: State) -> State:
    last = state["messages"][-1]
    results = [tool_executor.invoke(call) for call in last.tool_calls]
    return {"messages": results, "iteration": state["iteration"]}

def should_continue(state: State):
    last = state["messages"][-1]
    return "tools" if getattr(last, "tool_calls", None) else END

graph = StateGraph(State)
graph.add_node("agent", agent)
graph.add_node("tools", tools)
graph.set_entry_point("agent")
graph.add_conditional_edges("agent", should_continue)
graph.add_edge("tools", "agent")

memory = MemorySaver()
app = graph.compile(checkpointer=memory)

# Run with persistent thread
config = {"configurable": {"thread_id": "user-123"}}
for chunk in app.stream(
    {"messages": [("user", "Search for RAG best practices")], "iteration": 0},
    config,
):
    print(chunk)`,

  'ai-engineering__intermediate__2': `from langchain_anthropic import ChatAnthropic
from langchain_core.tools import tool
from langchain.agents import AgentExecutor, create_react_agent
from langchain_core.prompts import PromptTemplate

@tool
def search(query: str) -> str:
    """Search the web for information."""
    return f"Search results for: {query}"

@tool
def calculator(expression: str) -> str:
    """Evaluate a math expression."""
    return str(eval(expression))

tools = [search, calculator]
llm = ChatAnthropic(model="claude-opus-4-5")

# ReAct prompt: Thought → Action → Observation loop
react_prompt = PromptTemplate.from_template("""Answer using tools.
Tools available: {tools}
Tool names: {tool_names}

Question: {input}
Thought: {agent_scratchpad}""")

agent = create_react_agent(llm, tools, react_prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True, max_iterations=5)

result = executor.invoke({"input": "What is 25 * 48 and search for Python tips"})
# Output shows: Thought → Action: calculator → Observation → ... → Final Answer`,

  // ── AI Engineering · Expert ────────────────────────────────────────────────
  'ai-engineering__expert__0': `from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, TaskType
from trl import SFTTrainer, SFTConfig
from datasets import load_dataset
import torch

# QLoRA: quantize to 4-bit, train LoRA adapters only
bnb = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
)
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3.1-8B-Instruct",
    quantization_config=bnb, device_map="auto",
)

# LoRA: train 0.04% of params, rest frozen
lora = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=8,            # rank — higher = more expressiveness
    lora_alpha=16,  # scaling: effective_lr = lora_alpha / r
    lora_dropout=0.1,
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
)
model = get_peft_model(model, lora)
model.print_trainable_parameters()
# trainable: 3.4M / 8B (0.042%)

trainer = SFTTrainer(
    model=model,
    train_dataset=load_dataset("your/dataset", split="train"),
    args=SFTConfig(output_dir="./lora-output", num_train_epochs=3,
                   per_device_train_batch_size=4, gradient_accumulation_steps=4),
)
trainer.train()
model.save_pretrained("./my-lora-adapter")`,

  'ai-engineering__expert__2': `# MCP Server: expose 3 tools any MCP client can use
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp import types
import httpx, json

server = Server("my-tools-server")

@server.list_tools()
async def list_tools():
    return [
        types.Tool(name="search_docs", description="Search internal docs",
                   inputSchema={"type":"object","properties":{"query":{"type":"string"}}}),
        types.Tool(name="get_weather", description="Get current weather",
                   inputSchema={"type":"object","properties":{"city":{"type":"string"}}}),
        types.Tool(name="run_query", description="Run a read-only SQL query",
                   inputSchema={"type":"object","properties":{"sql":{"type":"string"}}}),
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "search_docs":
        results = search_internal_docs(arguments["query"])
        return [types.TextContent(type="text", text=json.dumps(results))]
    if name == "get_weather":
        async with httpx.AsyncClient() as c:
            r = await c.get(f"https://wttr.in/{arguments['city']}?format=3")
            return [types.TextContent(type="text", text=r.text)]

# claude_desktop_config.json — connect to Claude Desktop
# {
#   "mcpServers": {
#     "my-tools": {
#       "command": "python",
#       "args": ["path/to/server.py"]
#     }
#   }
# }

async def main():
    async with stdio_server() as (r, w):
        await server.run(r, w, server.create_initialization_options())`,
}

// Quiz questions keyed by roleId__levelId__skillIndex
export const QUIZ_QUESTIONS = {
  'ai-engineering__beginner__0': [{
    q: 'What does the temperature parameter control in an LLM?',
    options: ['Max tokens to generate', 'Randomness / creativity of output — lower = deterministic', 'Model version', 'API timeout'],
    answer: 1,
  }],
  'ai-engineering__beginner__1': [{
    q: 'Which prompting technique provides examples before asking the question?',
    options: ['Zero-shot', 'Chain-of-thought', 'Few-shot', 'System prompting'],
    answer: 2,
  }],
  'ai-engineering__beginner__2': [{
    q: 'What media type should a streaming SSE response use?',
    options: ['application/json', 'text/plain', 'text/event-stream', 'application/octet-stream'],
    answer: 2,
  }],
  'ai-engineering__beginner__3': [{
    q: 'Cosine similarity of 1.0 between two vectors means:',
    options: ['They are opposite', 'They are identical / perfectly aligned', 'They are orthogonal (unrelated)', 'One is the zero vector'],
    answer: 1,
  }],
  'ai-engineering__beginner__4': [{
    q: 'ChromaDB is what type of database?',
    options: ['Relational (SQL)', 'Key-value store', 'Vector / embedding database', 'Document store'],
    answer: 2,
  }],
  'ai-engineering__beginner__5': [{
    q: 'What does RAG stand for?',
    options: ['Rapid AI Generation', 'Retrieval-Augmented Generation', 'Recursive Attention Graph', 'Role-Aligned GPT'],
    answer: 1,
  }],
  'ai-engineering__beginner__6': [{
    q: 'The main user benefit of streaming LLM responses is:',
    options: ['Lower API cost', 'Fewer hallucinations', 'Tokens appear as generated — feels faster', 'Better accuracy'],
    answer: 2,
  }],
  'ai-engineering__beginner__7': [{
    q: 'Where should API keys like ANTHROPIC_API_KEY be stored?',
    options: ['In the git repository', 'In environment variables / secrets manager', 'In the frontend JavaScript bundle', 'In a public config file'],
    answer: 1,
  }],
  'ai-engineering__intermediate__0': [{
    q: 'In LangChain LCEL, the | operator connects:',
    options: ['Two databases', 'Runnable components into a chain (left output → right input)', 'API endpoints', 'Docker containers'],
    answer: 1,
  }],
  'ai-engineering__intermediate__1': [{
    q: 'In LangGraph, what does TypedDict State represent?',
    options: ['The graph\'s database schema', 'The shared mutable context passed between all nodes', 'The API request body', 'The model configuration'],
    answer: 1,
  }],
  'ai-engineering__intermediate__2': [{
    q: 'ReAct stands for:',
    options: ['Reactive Actions', 'Reasoning + Acting — interleaves thought and tool use', 'Recursive Agent Tasks', 'Real-time Context'],
    answer: 1,
  }],
  'ai-engineering__intermediate__3': [{
    q: 'Parallel tool calling improves:',
    options: ['Model accuracy', 'Latency — multiple tools run simultaneously instead of sequentially', 'Token count', 'Context length'],
    answer: 1,
  }],
  'ai-engineering__intermediate__4': [{
    q: 'Pinecone namespaces are used for:',
    options: ['Partitioning data per tenant / user — data isolation within one index', 'Storing API keys', 'Load balancing', 'Model versioning'],
    answer: 0,
  }],
  'ai-engineering__intermediate__5': [{
    q: 'Hybrid search combines:',
    options: ['SQL + NoSQL', 'BM25 keyword search + semantic vector search', 'Two different LLMs', 'Online + offline processing'],
    answer: 1,
  }],
  'ai-engineering__intermediate__6': [{
    q: 'LangSmith is primarily used for:',
    options: ['Fine-tuning models', 'Tracing, debugging, and evaluating LLM application calls', 'Deploying models to production', 'Vector database management'],
    answer: 1,
  }],
  'ai-engineering__intermediate__7': [{
    q: 'Human-in-the-loop in LangGraph means:',
    options: ['A human writes all agent code', 'Pausing graph execution for human review before proceeding', 'Using human-generated training data', 'Manual API calls'],
    answer: 1,
  }],
  'ai-engineering__intermediate__8': [{
    q: 'The difference between in-context and vector memory:',
    options: ['No difference', 'In-context = stored in prompt (limited), vector = retrieved from DB (unlimited history)', 'Vector is faster', 'In-context is more accurate'],
    answer: 1,
  }],
  'ai-engineering__expert__0': [{
    q: 'LoRA reduces trainable parameters by:',
    options: ['Deleting most layers', 'Adding low-rank adapter matrices only to specific layers, freezing the base model', 'Quantizing weights to 1-bit', 'Removing attention heads'],
    answer: 1,
  }],
  'ai-engineering__expert__1': [{
    q: 'In the supervisor multi-agent pattern, the supervisor\'s role is:',
    options: ['Execute all tools directly', 'Route tasks to specialist sub-agents and synthesize results', 'Store agent memory', 'Handle user authentication'],
    answer: 1,
  }],
  'ai-engineering__expert__2': [{
    q: 'MCP (Model Context Protocol) allows:',
    options: ['Fine-tuning models faster', 'Any MCP client (Claude Desktop, IDE) to use your custom tool server', 'Multi-GPU training', 'Streaming faster tokens'],
    answer: 1,
  }],
  'ai-engineering__expert__3': [{
    q: 'Semantic caching reduces LLM costs by:',
    options: ['Using smaller models', 'Returning cached responses for semantically similar (not just identical) queries', 'Compressing prompts', 'Batching requests'],
    answer: 1,
  }],
  'ai-engineering__expert__4': [{
    q: 'Prompt injection in AI agents means:',
    options: ['Injecting extra tokens to speed up output', 'Malicious input that hijacks the agent\'s instructions to perform unintended actions', 'A technique to improve prompt quality', 'Caching prompt templates'],
    answer: 1,
  }],
  'ai-engineering__expert__5': [{
    q: 'In a voice AI pipeline, ASR stands for:',
    options: ['Automated System Response', 'Automatic Speech Recognition — converts audio to text', 'Agent Streaming Runtime', 'Attention Score Reduction'],
    answer: 1,
  }],
  'ai-engineering__expert__6': [{
    q: 'RAGAS evaluates:',
    options: ['Agent speed', 'RAG quality: faithfulness, answer relevancy, context precision/recall', 'Model fine-tuning loss', 'API latency'],
    answer: 1,
  }],
  'ai-engineering__expert__7': [{
    q: 'The primary security risk RAGAS helps detect in RAG systems:',
    options: ['SQL injection', 'Hallucination — LLM answers that are not grounded in retrieved context', 'DDoS attacks', 'Token overflow'],
    answer: 1,
  }],
}

// Mermaid diagrams keyed by roleId__levelId
export const LEVEL_DIAGRAMS = {
  'ai-engineering__beginner': `flowchart TD
    A[User Query] --> B[Embed Query\\ntext-embedding-3-small]
    B --> C[Vector Search\\nChromaDB / Pinecone]
    C --> D[Top-K Chunks]
    D --> E[LLM + Context\\nClaude / GPT-4]
    E --> F[Answer + Citations]`,

  'ai-engineering__intermediate': `flowchart TD
    A[User Input] --> B[Agent Brain\\nLangGraph Node]
    B --> C{Need Tools?}
    C -->|Yes| D[Execute Tools\\nParallel Fan-out]
    D --> B
    C -->|No| E[Final Response]
    B --> F[MemorySaver\\nCheckpoint]`,

  'ai-engineering__expert': `flowchart TD
    A[User Request] --> B[Supervisor Agent]
    B --> C[FAQ Agent]
    B --> D[Order Agent]
    B --> E[Escalation Agent]
    C --> F{HITL Review}
    D --> F
    E --> G[Slack Alert]
    F -->|Approved| H[Execute Action]`,

  'cybersecurity__beginner': `flowchart TD
    A[Attacker] --> B{Attack Vector}
    B --> C[SQL Injection\\nBypass login]
    B --> D[XSS\\nSteal cookie]
    B --> E[CSRF\\nForce action]
    C --> F[DB Breach]
    D --> G[Session Hijack]
    E --> H[Unauthorized Action]`,

  'cybersecurity__intermediate': `flowchart LR
    A[System Asset] --> B[Identify Threats\\nSTRIDE Model]
    B --> C[CVSS Score\\nRisk Rating]
    C --> D{Priority}
    D -->|Critical| E[Fix Now]
    D -->|Medium| F[Sprint Backlog]
    E --> G[Verify Fix]
    F --> G`,

  'cybersecurity__expert': `flowchart TD
    A[Recon] --> B[Initial Access]
    B --> C[Privilege Escalation]
    C --> D[Lateral Movement]
    D --> E[Exfiltration]
    E --> F[Report\\nMITRE ATT&CK Map]`,

  'devops__beginner': `flowchart LR
    A[Git Push] --> B[CI Triggered\\nGitHub Actions]
    B --> C[Lint + Test]
    C --> D[Docker Build]
    D --> E[Push to Registry\\nECR / GHCR]
    E --> F[Deploy\\nRailway / EC2]
    F --> G[Health Check]`,

  'devops__intermediate': `flowchart TD
    A[Developer] --> B[kubectl apply]
    B --> C[K8s API Server]
    C --> D[Scheduler]
    D --> E[Pod on Node]
    E --> F[ClusterIP Service]
    F --> G[Ingress + TLS]
    E --> H[HPA Auto-scale\\nCPU > 80%]`,

  'devops__expert': `flowchart LR
    A[Git Push] --> B[ArgoCD\\nDetects Drift]
    B --> C[Sync K8s State]
    C --> D{Healthy?}
    D -->|Yes| E[Promote to Prod]
    D -->|No| F[Auto Rollback]
    E --> G[Chaos Monkey\\nFault Injection]
    G --> H[Alert + Postmortem]`,

  'backend__beginner': `flowchart LR
    A[Client] --> B[Load Balancer]
    B --> C[API Server]
    C --> D{JWT Valid?}
    D -->|Yes| E[Business Logic]
    D -->|No| F[401 Error]
    E --> G[PostgreSQL]
    G --> H[Redis Cache]`,

  'backend__intermediate': `flowchart TD
    A[API Gateway] --> B[Auth Service]
    A --> C[User Service]
    A --> D[Order Service]
    B --> E[Kafka\\nMessage Bus]
    C --> E
    D --> E
    E --> F[Notification\\nService]`,

  'backend__expert': `flowchart LR
    A[Command] --> B[Aggregate Root]
    B --> C[Domain Event]
    C --> D[Event Store]
    D --> E[Projector]
    E --> F[Read Model\\nCQRS Query]`,

  'frontend__beginner': `flowchart TD
    A[JSX Template] --> B[Babel Compile]
    B --> C[React Component]
    C --> D[useState / Props]
    D --> E[Virtual DOM]
    E --> F[Diff Algorithm]
    F --> G[Real DOM Update]`,

  'frontend__intermediate': `flowchart LR
    A[User Action] --> B[Dispatch]
    B --> C[Zustand / Redux\\nStore]
    C --> D[State Updated]
    D --> E[Selector\\nMemoize]
    E --> F[Component\\nRe-render]`,

  'frontend__expert': `flowchart TD
    A[Bundle Analysis\\nWebpack / Rollup] --> B[Code Splitting\\nDynamic Import]
    B --> C[Lazy Load\\nRoutes + Components]
    C --> D[CDN Cache\\nCloudFront]
    D --> E[Service Worker\\nOffline Cache]
    E --> F[Core Web Vitals\\nLCP / CLS / INP]`,

  'cloud__beginner': `flowchart LR
    A[User] --> B[Route53\\nDNS]
    B --> C[CloudFront\\nCDN]
    C --> D[ALB]
    D --> E[EC2 / Lambda]
    E --> F[RDS Primary]
    E --> G[S3 Storage]`,

  'cloud__intermediate': `flowchart TD
    A[Internet] --> B[WAF + Shield]
    B --> C[ALB\\nWeb Tier]
    C --> D[ECS / EKS\\nApp Tier]
    D --> E[RDS + ElastiCache\\nData Tier]
    D --> F[SQS Queue]
    F --> G[Lambda Worker]`,

  'cloud__expert': `flowchart LR
    A[Global Traffic\\nRoute53 Latency] --> B[Primary Region\\nus-east-1]
    A --> C[DR Region\\neu-west-1]
    B --> D[RDS Multi-AZ]
    D -.Replication.-> C
    C --> E{Health Check}
    E -->|Fail| F[Automatic Failover]`,

  'data-engineering__beginner': `flowchart LR
    A[Sources\\nDB / API / Files] --> B[Extract]
    B --> C[Transform\\nClean + Validate]
    C --> D[Load\\nData Warehouse]
    D --> E[dbt Models]
    E --> F[BI Dashboard]`,

  'data-engineering__intermediate': `flowchart TD
    A[Data Sources] --> B[Airbyte\\nIngestion]
    B --> C[Data Lake\\nS3 / GCS]
    C --> D[dbt\\nTransform]
    D --> E[Snowflake\\nor BigQuery]
    E --> F[Airflow\\nOrchestrate]
    F --> G[Metabase\\nor Looker]`,

  'data-engineering__expert': `flowchart LR
    A[Event Producer] --> B[Apache Kafka]
    B --> C[Flink\\nStream Process]
    C --> D[Feature Store]
    D --> E[ML Model\\nReal-time]
    B --> F[Iceberg\\nData Lake]
    F --> G[Batch Analytics]`,

  'system-design__beginner': `flowchart LR
    A[Client] --> B[DNS Lookup]
    B --> C[CDN\\nEdge Cache]
    C --> D[Load Balancer]
    D --> E[App Server]
    E --> F[Redis Cache]
    E --> G[PostgreSQL]`,

  'system-design__intermediate': `flowchart TD
    A[Users] --> B[API Gateway]
    B --> C[Auth Service]
    B --> D[User Service]
    B --> E[Order Service]
    C --> F[Message Queue\\nRabbitMQ / Kafka]
    D --> F
    E --> F`,

  'system-design__expert': `flowchart LR
    A[Global DNS\\nRoute53] --> B[Region 1\\nShards 0-49%]
    A --> C[Region 2\\nShards 50-100%]
    B --> D[Consensus\\nRaft Protocol]
    C --> D
    D --> E[Consistent\\nGlobal State]`,

  'sre__beginner': `flowchart LR
    A[Application] --> B[Metrics\\nPrometheus]
    A --> C[Logs\\nELK Stack]
    A --> D[Traces\\nJaeger / Tempo]
    B --> E[Grafana\\nDashboards]
    B --> F[AlertManager]
    F --> G[PagerDuty]`,

  'sre__intermediate': `flowchart TD
    A[Alert Fires] --> B[PagerDuty\\nPage On-call]
    B --> C[Acknowledge\\nWithin SLA]
    C --> D{Severity?}
    D -->|P0| E[War Room\\nComms Bridge]
    D -->|P1| F[Solo Fix]
    E --> G[Root Cause\\nAnalysis]
    G --> H[Post-mortem]`,

  'sre__expert': `flowchart LR
    A[Define SLIs\\nLatency / Error Rate] --> B[Set SLO\\n99.9% Target]
    B --> C[Error Budget\\n0.1% = 43min/month]
    C --> D{Budget OK?}
    D -->|Yes| E[Ship Features]
    D -->|Burned| F[Reliability Sprint\\nFreeze Deploys]
    F --> C`,

  'database-engineering__beginner': `flowchart TD
    A[SQL Query] --> B[Parser\\nAST]
    B --> C[Query Planner\\nCost Estimation]
    C --> D{Index Exists?}
    D -->|Yes| E[Index Scan\\nO log n]
    D -->|No| F[Sequential Scan\\nO n]
    E --> G[Return Results]
    F --> G`,

  'database-engineering__intermediate': `flowchart LR
    A[Write\\nPrimary DB] --> B[WAL\\nWrite-Ahead Log]
    B --> C[Replica 1\\nRead Traffic]
    B --> D[Replica 2\\nRead Traffic]
    C --> E{Primary Fails?}
    D --> E
    E -->|Yes| F[Promote Replica\\nFailover]`,

  'database-engineering__expert': `flowchart TD
    A[Write Request] --> B[Shard Router]
    B --> C{Hash Key}
    C --> D[Shard 1\\n0-33%]
    C --> E[Shard 2\\n34-66%]
    C --> F[Shard 3\\n67-100%]
    D --> G[Cross-Shard\\nQuery Merge]
    E --> G
    F --> G`,

  'mobile-engineering__beginner': `flowchart LR
    A[JavaScript\\nReact Native] --> B[Metro Bundler]
    B --> C[JS Thread]
    C --> D[Bridge / JSI\\nNew Architecture]
    D --> E[Native Thread]
    E --> F[iOS UIKit\\nor Android View]`,

  'mobile-engineering__intermediate': `flowchart TD
    A[App Launch] --> B[Root Navigator]
    B --> C[Tab Navigator]
    C --> D[Stack Screen]
    D --> E[Modal Screen]
    A --> F[Deep Link\\nURL Handler]
    F --> D`,

  'mobile-engineering__expert': `flowchart LR
    A[Swift / Kotlin\\nNative Code] --> B[TurboModule Spec\\n.ts interface]
    B --> C[CodeGen\\nAuto-bridge]
    C --> D[JS Interface]
    D --> E[React Native\\nComponent]
    E --> F[App User]`,

  'api-integration__beginner': `flowchart LR
    A[Client Request] --> B[Validate Input\\nPydantic / Zod]
    B --> C{Auth Check}
    C -->|Valid| D[Business Logic]
    C -->|Invalid| E[401 / 403]
    D --> F[Database]
    F --> G[JSON Response]`,

  'api-integration__intermediate': `flowchart TD
    A[Client App] --> B[Auth Server\\nRequest Code]
    B --> C[User Login\\n+ Consent Screen]
    C --> D[Auth Code\\nReturned]
    D --> E[Exchange for\\nAccess Token]
    E --> F[API Call\\nBearer Token]
    F --> G[Refresh\\nWhen Expired]`,

  'api-integration__expert': `flowchart LR
    A[Event Producer] --> B[Event Bus\\nKafka / SNS]
    B --> C[Consumer A\\nInventory]
    B --> D[Consumer B\\nAnalytics]
    B --> E[Consumer C\\nNotifications]
    C --> F[Dead Letter\\nQueue]
    D --> F`,

  'privacy-engineering__beginner': `flowchart TD
    A[Data Collection] --> B[Classify PII\\nName / Email / IP]
    B --> C[Obtain Consent\\nGDPR / CCPA]
    C --> D[Process Minimized\\nData Only]
    D --> E[Encrypt at Rest\\n+ In Transit]
    E --> F[Retention Policy\\nAuto-Delete]`,

  'privacy-engineering__intermediate': `flowchart LR
    A[Feature Design] --> B[Data Flow\\nMapping]
    B --> C[Privacy\\nThreat Model]
    C --> D[Implement Controls\\nAnonymize / Pseudonymize]
    D --> E[DPIA\\nImpact Assessment]
    E --> F[DPO Review\\n+ Approval]`,

  'privacy-engineering__expert': `flowchart TD
    A[Client Device\\nLocal Training] --> B[Compute Gradients\\nNot Raw Data]
    B --> C[Upload Gradients\\nPrivacy Preserved]
    C --> D[Central Aggregator\\nFedAvg]
    D --> E[Global Model Update]
    E --> A`,
}

// Resource type inference from URL/label
export function getResourceType(resource) {
  const url = resource.url.toLowerCase()
  const label = resource.label.toLowerCase()
  if (url.includes('youtube') || url.includes('youtu.be') || label.includes('video')) return 'Video'
  if (label.includes('interactive') || url.includes('tryhackme') || url.includes('linuxsurvival') || url.includes('portswigger') || url.includes('hack')) return 'Interactive'
  if (label.includes('course') || label.includes('academy') || label.includes('tutorial') || label.includes('learn')) return 'Course'
  if (label.includes('docs') || label.includes('documentation') || url.includes('/docs/') || label.includes('guide') || label.includes('reference')) return 'Docs'
  if (label.includes('book') || label.includes('pdf')) return 'Book'
  return 'Article'
}

export function isFreeResource(resource) {
  return resource.label.toLowerCase().includes('free') || resource.label.toLowerCase().includes('(free)')
}
