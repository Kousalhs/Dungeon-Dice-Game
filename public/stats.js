const list = document.getElementById("stats-list");
const error = document.getElementById("stats-error");

try {
  const res = await fetch("/api/stats");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not load stats.");

  const best = data.bestRun
    ? `${data.bestRun.wins} win(s), ${data.bestRun.losses} loss(es), ${data.bestRun.draws ?? 0} draw(s) in ${data.bestRun.totalBattles} battle(s)`
    : "No completed battles yet";

  const rows = [
    ["Total battles", data.totalBattles],
    ["Wins", data.wins],
    ["Losses", data.losses],
    ["Draws", data.draws ?? 0],
    ["Best run", best],
  ];
  for (const [label, value] of rows) {
    const li = document.createElement("li");
    li.innerHTML = "<strong></strong> ";
    li.querySelector("strong").textContent = `${label}:`;
    li.append(String(value));
    list.appendChild(li);
  }
} catch (err) {
  error.textContent = err.message;
}
