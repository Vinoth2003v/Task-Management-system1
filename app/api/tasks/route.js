export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const assignedTo = searchParams.get('assignedTo');
    const createdBy = searchParams.get('createdBy');

    let url = 'http://localhost:4000/tasks';
    if (assignedTo) {
      url += `?assignedTo=${encodeURIComponent(assignedTo)}`;
    } else if (createdBy) {
      url += `?createdBy=${encodeURIComponent(createdBy)}`;
    }

    const res = await fetch(url, { cache: 'no-store' });
    const tasks = await res.json();
    return Response.json(tasks);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const body = await req.json();

  const newTask = {
    title: body.title,
    assignedTo: body.assignedTo || "",
    dueDate: body.dueDate,
    priority: body.priority,
    createdBy: body.createdBy,
    status: body.status || "Todo",
    description: body.description || "",
    category: body.category || "Uncategorized",
    labels: body.labels || [],
  };

  const response = await fetch('http://localhost:4000/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newTask)
  });

  const task = await response.json();
  return Response.json(task);
}