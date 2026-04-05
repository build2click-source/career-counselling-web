async function test() {
  try {
    const res = await fetch("https://api-v2.onetcenter.org/online/occupations/15-1252.00", {
      headers: { "X-API-Key": "MfxL9-U6Oih-DF0AF-7OCQQ", "Accept": "application/json" }
    });
    const data = await res.json();
    console.log("ROOT KEYS:", Object.keys(data));
    console.log("data.title:", data.title);
    console.log("data.description:", data.description);
  } catch (e) { console.log(e); }
}
test();
