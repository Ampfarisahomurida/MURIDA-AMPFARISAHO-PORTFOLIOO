async function loadFaqs() {
  const res = await fetch('/api/admin/faqs');
  const json = await res.json();
  const container = document.getElementById('faqs');
  container.innerHTML = '';
  if (json && json.success) {
    json.faqs.forEach(f => {
      const el = document.createElement('div');
      el.className = 'faq-item';
      el.innerHTML = `<div><strong>Triggers:</strong> ${f.triggers.join(', ')}</div>
        <div style="margin-top:8px;">${f.answer}</div>
        <div class="controls" style="margin-top:8px;"><button data-id="${f.id}" class="edit">Edit</button><button data-id="${f.id}" class="del">Delete</button></div>`;
      container.appendChild(el);
    });
    container.querySelectorAll('.edit').forEach(btn => btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      const faq = json.faqs.find(x => x.id == id);
      document.getElementById('triggers').value = faq.triggers.join(',');
      document.getElementById('addFaq').dataset.edit = id;
      document.getElementById('addFaq').textContent = 'Update FAQ';
    }));
    container.querySelectorAll('.del').forEach(btn => btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      if (!confirm('Delete this FAQ?')) return;
      const resp = await fetch(`/api/admin/faqs?id=${id}`, { method: 'DELETE' });
      const j = await resp.json();
      if (j && j.success) loadFaqs();
      else alert('Delete failed');
    }));
  }
}

document.getElementById('addFaq').addEventListener('click', async () => {
  const triggers = document.getElementById('triggers').value.split(',').map(s => s.trim()).filter(Boolean);
  const answer = prompt('Enter FAQ answer text');
  if (!answer) return;
  const editId = document.getElementById('addFaq').dataset.edit || null;
  const res = await fetch('/api/admin/faqs', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id: editId, triggers, answer }) });
  const j = await res.json();
  if (j && j.success) {
    document.getElementById('triggers').value = '';
    document.getElementById('addFaq').dataset.edit = '';
    document.getElementById('addFaq').textContent = 'Add / Update FAQ';
    loadFaqs();
  } else alert('Save failed');
});

document.getElementById('exportChats').addEventListener('click', async () => {
  const res = await fetch('/api/admin/export');
  const j = await res.json();
  if (j && j.success) {
    const blob = new Blob([JSON.stringify(j.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chats-export.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else alert('Export failed');
});
  document.getElementById('showAnalytics').addEventListener('click', async () => {
    const res = await fetch('/api/admin/analytics');
    const j = await res.json();
    if (j && j.success) {
      const area = document.createElement('pre');
      area.textContent = JSON.stringify(j.analytics, null, 2);
      document.querySelector('.faq-list').appendChild(area);
    } else alert('Analytics failed');
  });

loadFaqs();
// End
