export async function POST(req) {
  try {
    const { name, email, password, role } = await req.json();

    // Check if user already exists
    const checkRes = await fetch(`http://localhost:4000/users?email=${encodeURIComponent(email)}`, {
      cache: 'no-store',
    });
    const existing = await checkRes.json();

    if (existing && existing.length > 0) {
      return Response.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // Create new user in json-server
    const createRes = await fetch('http://localhost:4000/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });

    const user = await createRes.json();
    return Response.json({ user });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}