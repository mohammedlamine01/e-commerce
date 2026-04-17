import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, orderBy, query, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAoCIHBSwBpre2kfyF8teTKkRdRZyeLl9E",
  authDomain: "webapp-ce0ce.firebaseapp.com",
  projectId: "webapp-ce0ce",
  storageBucket: "webapp-ce0ce.appspot.com",
  messagingSenderId: "389804133548",
  appId: "1:389804133548:web:af04ba2bbc64afa969e309"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window._db = db;
window._addDoc = addDoc;
window._collection = collection;
window._doc = doc;
window._deleteDoc = deleteDoc;
window._updateDoc = updateDoc;

let editingProductId = null;

// Real-time listener
const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
onSnapshot(q, (snap) => {
  window._products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  document.getElementById("productCount").textContent = window._products.length + " products";
  window.renderProducts();
}, () => {
  window._products = window._products || [];
});

window._products = [];
let currentView = 'grid';

/* ── Tab switch ── */
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((b, i) => b.classList.toggle('active', (i === 0) === (tab === 'product')));
  document.getElementById('productPanel').classList.toggle('visible', tab === 'product');
  document.getElementById('uploadPanel').classList.toggle('visible', tab === 'upload');
}
window.switchTab = switchTab;

/* ── Image preview ── */
function handleDrop(input) {
  const file = input.files[0];
  if (!file) return;
  const preview = document.getElementById('dropPreview');
  const content = document.getElementById('dropContent');
  const reader = new FileReader();
  reader.onload = e => {
    preview.src = e.target.result;
    preview.style.display = 'block';
    content.style.display = 'none';
  };
  reader.readAsDataURL(file);
}
window.handleDrop = handleDrop;

/* ── View toggle ── */
function setView(v) {
  currentView = v;
  document.getElementById('gridBtn').classList.toggle('active', v === 'grid');
  document.getElementById('listBtn').classList.toggle('active', v === 'list');
  renderProducts();
}
window.setView = setView;

/* ── Render products ── */
function renderProducts() {
  const container = document.getElementById('productsContainer');
  const search = document.getElementById('searchInput').value.toLowerCase();
  const sort = document.getElementById('sortSelect').value;

  let products = (window._products || []).filter(p =>
    (p.name || '').toLowerCase().includes(search) ||
    (p.type || '').toLowerCase().includes(search) ||
    (p.description || '').toLowerCase().includes(search)
  );

  if (sort === 'price-asc') products.sort((a, b) => (a.newPrice || 0) - (b.newPrice || 0));
  else if (sort === 'price-desc') products.sort((a, b) => (b.newPrice || 0) - (a.newPrice || 0));
  else if (sort === 'name') products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  document.getElementById('visibleCount').textContent = products.length + ' items';

  if (!products.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">${search ? 'No results found' : 'No products yet'}</div>
        <div class="empty-sub">${search ? 'Try a different search term' : 'Tap <strong>＋</strong> to add your first product'}</div>
      </div>`;
    return;
  }

  if (currentView === 'grid') {
    container.innerHTML = `<div class="grid-view">${products.map(cardHTML).join('')}</div>`;
  } else {
    container.innerHTML = `<div class="list-view">${products.map(rowHTML).join('')}</div>`;
  }
}
window.renderProducts = renderProducts;

function cardHTML(p) {
  const imgBlock = p.imageUrl
    ? `<div class="card-image"><img src="${p.imageUrl}" alt="${p.name}" onerror="this.parentElement.innerHTML='📦'"></div>`
    : `<div class="card-image">📦</div>`;
  const discount = p.oldPrice > p.newPrice ? Math.round((1 - p.newPrice / p.oldPrice) * 100) : 0;
  return `
    <div class="product-card">
      ${imgBlock}
      <div class="card-body">
        <div class="card-name">${p.name || '—'}</div>
        <div class="card-type">${p.type || ''}</div>
        <div class="card-pricing">
          <span class="price-new">$${(p.newPrice || 0).toFixed(2)}</span>
          ${p.oldPrice ? `<span class="price-old">$${p.oldPrice.toFixed(2)}</span>` : ''}
        </div>
        <div class="card-meta">
          <span class="qty-badge">Qty: ${p.quantity || 0}</span>
          ${p.size ? `<span class="size-tag">${p.size}</span>` : ''}
        </div>
        <div class="card-actions" style="margin-top: 10px; display: flex; gap: 6px;">
          <button onclick="editProduct('${p.id}')" style="flex:1; padding: 6px; cursor: pointer; border: 1px solid #ddd; background: #fff; border-radius: 4px; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 4px; color: #333;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a1.5 1.5 0 0 1 2.12 2.12L7 19l-4 1 1-4Z"></path></svg> Edit
          </button>
          <button onclick="deleteProduct('${p.id}')" style="flex:1; padding: 6px; cursor: pointer; border: 1px solid #fdd; background: #fff; border-radius: 4px; color: #dc2626; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 4px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Delete
          </button>
        </div>
      </div>
    </div>`;
}

function rowHTML(p) {
  const imgBlock = p.imageUrl
    ? `<div class="list-thumb"><img src="${p.imageUrl}" alt="${p.name}" onerror="this.parentElement.innerHTML='📦'"></div>`
    : `<div class="list-thumb">📦</div>`;
  return `
    <div class="list-row">
      ${imgBlock}
      <div>
        <div class="list-name">${p.name || '—'}</div>
        <div class="list-sub">${p.type || ''}</div>
      </div>
      <div class="list-price">$${(p.newPrice || 0).toFixed(2)}</div>
      <div class="list-qty">x ${p.quantity || 0}</div>
      <div class="list-size">${p.size || ''}</div>
      <div class="list-actions" style="display: flex; gap: 6px; margin-left: auto;">
        <button onclick="editProduct('${p.id}')" style="padding: 6px 12px; cursor: pointer; border: 1px solid #ddd; background: #fff; border-radius: 4px; font-weight: bold; display: flex; align-items: center; gap: 4px; color: #333;" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a1.5 1.5 0 0 1 2.12 2.12L7 19l-4 1 1-4Z"></path></svg>
        </button>
        <button onclick="deleteProduct('${p.id}')" style="padding: 6px 12px; cursor: pointer; border: 1px solid #fdd; background: #fff; border-radius: 4px; color: #dc2626; font-weight: bold; display: flex; align-items: center; gap: 4px;" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>`;
}

// ... and so on for the rest of the script ...

async function saveProduct() {
    const btn = document.getElementById('saveProductBtn');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
        const file = document.getElementById("productImage").files[0];
        const name = document.getElementById("name").value;
        const size = document.getElementById("size").value;
        const type = document.getElementById("type").value;
        const oldPrice = document.getElementById("oldPrice").value;
        const newPrice = document.getElementById("newPrice").value;
        const quantity = document.getElementById("quantity").value;
        const description = document.getElementById("description").value;

        if ((!file && !editingProductId) || !name || !newPrice) {
            showToast("Please fill in at least image, name, and new price.", "error");
            return;
        }

        let imageUrl = null;

        if (file) {
            showToast("Uploading image...", "info");
            const formData = new FormData();
            formData.append("image", file);

            const uploadRes = await fetch("/upload-image", {
                method: "POST",
                body: formData,
            });

            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData.error || 'Image upload failed');

            imageUrl = uploadData.imageUrl || `https://shelegant.ct.ws/uploads/${uploadData.filename}`;
        }

        showToast("Saving product...", "info");

        const productData = {
            name,
            size,
            type,
            oldPrice: Number(oldPrice) || 0,
            newPrice: Number(newPrice),
            quantity: Number(quantity) || 0,
            description,
        };

        if (imageUrl) {
            productData.imageUrl = imageUrl;
        }

        if (editingProductId) {
             await window._updateDoc(window._doc(window._db, "products", editingProductId), productData);
             showToast("Product updated successfully!", "success");
        } else {
             productData.createdAt = new Date();
             await window._addDoc(window._collection(window._db, "products"), productData);
             showToast("Product saved successfully!", "success");
        }
        
        resetForm();
        closeDrawer();

    } catch (err) {
        showToast("Error: " + err.message, "error");
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}
window.saveProduct = saveProduct;

function editProduct(productId) {
    const product = window._products.find(p => p.id === productId);
    if (!product) return;

    editingProductId = productId;

    // Populate form
    document.getElementById("name").value = product.name || '';
    document.getElementById("size").value = product.size || '';
    document.getElementById("type").value = product.type || '';
    document.getElementById("oldPrice").value = product.oldPrice || '';
    document.getElementById("newPrice").value = product.newPrice || '';
    document.getElementById("quantity").value = product.quantity || '';
    document.getElementById("description").value = product.description || '';

    // Show existing image preview if available
    if (product.imageUrl) {
        const preview = document.getElementById('dropPreview');
        preview.src = product.imageUrl;
        preview.style.display = 'block';
        document.getElementById('dropContent').style.display = 'none';
    }

    const saveBtnLabel = document.querySelector('#saveProductBtn .btn-label');
    if (saveBtnLabel) saveBtnLabel.textContent = "Update Product";

    switchTab('product');
    openDrawer();
}
window.editProduct = editProduct;

async function deleteProduct(productId) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
        const product = window._products.find(p => p.id === productId);

        if (product && product.imageUrl) {
            const filename = product.imageUrl.split('/').pop();
            if (filename) {
                try {
                    await fetch("/delete-image", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ filename })
                    });
                } catch (e) {
                    console.error("Failed to delete image from FTP:", e);
                }
            }
        }

        await window._deleteDoc(window._doc(window._db, "products", productId));
        showToast("Product deleted successfully", "success");
        if (editingProductId === productId) {
            resetForm();
        }
    } catch (err) {
        showToast("Error deleting product: " + err.message, "error");
    }
}
window.deleteProduct = deleteProduct;

function resetForm() {
    editingProductId = null;
    const saveBtnLabel = document.querySelector('#saveProductBtn .btn-label');
    if (saveBtnLabel) saveBtnLabel.textContent = "Save Product";
    document.getElementById('productImage').value = '';
    document.getElementById('name').value = '';
    document.getElementById('size').value = '';
    document.getElementById('type').value = '';
    document.getElementById('oldPrice').value = '';
    document.getElementById('newPrice').value = '';
    document.getElementById('quantity').value = '';
    document.getElementById('description').value = '';
    document.getElementById('dropPreview').style.display = 'none';
    document.getElementById('dropContent').style.display = 'block';
}

async function uploadImage() {
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];
    if (!file) {
        showToast("Please select an image first.", "error");
        return;
    }

    const formData = new FormData();
    formData.append("image", file);

    const resultDiv = document.getElementById('uploadResult');
    resultDiv.style.display = 'block';
    resultDiv.textContent = 'Uploading...';

    try {
        const response = await fetch("/upload-image", {
            method: "POST",
            body: formData,
        });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Upload failed");

        const publicBaseUrl = document.getElementById('publicBaseUrl').value.trim();
        const previewUrl = data.imageUrl || (publicBaseUrl ? `${publicBaseUrl.replace(/\/$/, "")}/${data.filename}` : '');

        let resultText = `✅ Upload successful.\n`;
        if (previewUrl) {
            resultText += `URL: ${previewUrl}`;
        } else {
            resultText += `Filename: ${data.filename}. Enter a public URL base to get a full URL.`;
        }
        resultDiv.textContent = resultText;
        showToast("Image uploaded!", "success");

    } catch (error) {
        resultDiv.textContent = "Error: " + error.message;
        showToast("Upload failed.", "error");
    }
}
window.uploadImage = uploadImage;

function showToast(message, type = 'info') {
    const wrap = document.getElementById('toastWrap');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    wrap.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

function openDrawer() {
    document.querySelector('.sidebar').classList.add('drawer-open');
    document.getElementById('drawerOverlay').classList.add('open');
}
window.openDrawer = openDrawer;

function closeDrawer() {
    document.querySelector('.sidebar').classList.remove('drawer-open');
    document.getElementById('drawerOverlay').classList.remove('open');
}
window.closeDrawer = closeDrawer;
