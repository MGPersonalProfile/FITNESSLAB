const base64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

async function test() {
  console.log("Sending request to http://localhost:3000/api/analyze...");
  try {
    const res = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response Body:", text);
    process.exit(res.status === 200 ? 0 : 1);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

test();
