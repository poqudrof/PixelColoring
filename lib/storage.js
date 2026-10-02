// Browser persistence: settings go to localStorage, the imported image file
// to IndexedDB (it can exceed the localStorage quota). Failures are ignored so
// private browsing or a full disk never break the app.
export function loadJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}
export function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
function request(run) {
  return new Promise((resolve, reject) => {
    const req = run();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function withStore(mode, run) {
  const db = await request(() => {
    const open = indexedDB.open("pixel-paper", 1);
    open.onupgradeneeded = () => open.result.createObjectStore("files");
    return open;
  });
  try {
    return await request(() =>
      run(db.transaction("files", mode).objectStore("files")),
    );
  } finally {
    db.close();
  }
}
export function loadFile(key) {
  return withStore("readonly", (store) => store.get(key)).catch(() => null);
}
export function saveFile(key, file) {
  return withStore("readwrite", (store) => store.put(file, key)).catch(
    () => {},
  );
}
