
import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";

const API = "https://quiet-battles-backend-sskl.onrender.com/api";
const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`
  }
});

export default function AdminDashboard() {
  const [section, setSection] = useState("series");
  const [series, setSeries] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    cover_image: "",
    status: "Draft",
    series_id: "",
    chapter_number: "",
    story_content: "",
    name: "",
    price: "",
    image_url: ""
  });

  const [editingId, setEditingId] = useState(null);

  const loadData = async () => {
  try {
    // Load Series independently
    const s = await axios.get(`${API}/content/series`);

    setSeries(s.data);

    if (s.data.length > 0) {
      const activeSeriesId = Number(form.series_id) || s.data[0].id;

      setForm(prev => ({
        ...prev,
        series_id: String(activeSeriesId)
      }));

      const c = await axios.get(
        `${API}/content/series/${activeSeriesId}/chapters`
      );

      setChapters(c.data);
    } else {
      setChapters([]);
    }

  } catch (error) {
    console.error("Series/Chapters loading error:", error);
    setMessage("Unable to load Series or Chapters.");
  }

  // Load Products separately
  try {
    const p = await axios.get(`${API}/products`);
    setProducts(p.data);
  } catch (error) {
    console.error("Products loading error:", error);
  }
};



const handleSeriesSelect = async (e) => {
  const seriesId = e.target.value;

  setForm(prev => ({
    ...prev,
    series_id: seriesId
  }));

  if (!seriesId) {
    setChapters([]);
    return;
  }

  try {
    const response = await axios.get(
      `${API}/content/series/${seriesId}/chapters`
    );

    setChapters(response.data);
  } catch (error) {
    console.error("Chapter loading error:", error);
    setChapters([]);
    setMessage("Unable to load chapters for this series.");
  }
};

  useEffect(() => {
    loadData();
  }, []);

  const updateForm = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      title: "",
      slug: "",
      description: "",
      cover_image: "",
      status: "Draft",
      series_id: "",
      chapter_number: "",
      story_content: "",
      name: "",
      price: "",
      image_url: ""
    });
    setEditingId(null);
  };

  const saveItem = async (e) => {
    e.preventDefault();

    try {
      let endpoint = "";
      let payload = {};
      let method = editingId ? "put" : "post";

      if (section === "series") {
        endpoint = `${API}/content/series${editingId ? `/${editingId}` : ""}`;
        payload = {
          title: form.title,
          slug: form.slug,
          description: form.description,
          cover_image: form.cover_image,
          status: form.status
        };
      } else if (section === "chapters") {
        endpoint = `${API}/content/chapters${editingId ? `/${editingId}` : ""}`;
        payload = {
          series_id: Number(form.series_id),
          chapter_number: Number(form.chapter_number),
          title: form.title,
          slug: form.slug,
          story_content: form.story_content,
          cover_image: form.cover_image
        };
      } else {
        endpoint = `${API}/content/products${editingId ? `/${editingId}` : ""}`;
        payload = {
          name: form.name,
          description: form.description,
          price: Number(form.price),
          image_url: form.image_url
        };
      }

      await axios[method](endpoint, payload, getAuthConfig());
      setMessage("Saved successfully!");
      resetForm();
      loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to save item.");
    }
  };

  const editItem = (item) => {
    setEditingId(item.id);

    if (section === "series") {
      setForm({ ...form, ...item });
    } else if (section === "chapters") {
      setForm({
        ...form,
        ...item,
        series_id: String(item.series_id),
        chapter_number: String(item.chapter_number)
      });
    } else {
      setForm({
        ...form,
        name: item.name,
        description: item.description,
        price: item.price,
        image_url: item.image_url
      });
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      const endpoint =
        section === "series"
          ? `${API}/content/series/${id}`
          : section === "chapters"
          ? `${API}/content/chapters/${id}`
          : `${API}/content/products/${id}`;

      await axios.delete(endpoint, getAuthConfig());
      setMessage("Deleted successfully!");
      loadData();
    } catch (error) {
      setMessage("Unable to delete item.");
    }
  };

  const items =
    section === "series"
      ? series
      : section === "chapters"
      ? chapters
      : products;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>QUIET BATTLES™</h2>
        <p>CONTENT MANAGEMENT</p>

        <button onClick={() => { setSection("series"); resetForm(); }}>
          Series
        </button>
        <button onClick={() => { setSection("chapters"); resetForm(); }}>
          Chapters
        </button>
        <button onClick={() => { setSection("products"); resetForm(); }}>
          Products
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <p>QUIET BATTLES / ADMIN</p>
            <h1>{section.toUpperCase()} MANAGEMENT</h1>
          </div>
          <span>ADMIN PANEL</span>
        </header>

        {message && <p className="admin-message">{message}</p>}

        <section className="admin-form-card">
          <h2>{editingId ? "Edit" : "Add New"} {section}</h2>

          <form onSubmit={saveItem}>
            {section === "series" && (
              <>
                <input name="title" placeholder="Series title" value={form.title} onChange={updateForm} required />
                <input name="slug" placeholder="URL slug" value={form.slug} onChange={updateForm} required />
                <textarea name="description" placeholder="Series description" value={form.description} onChange={updateForm} />
                <input name="cover_image" placeholder="Cover image URL" value={form.cover_image} onChange={updateForm} />
                <select name="status" value={form.status} onChange={updateForm}>
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
              </>
            )}

            {section === "chapters" && (
              <>
                <select name="series_id" value={form.series_id} onChange={handleSeriesSelect} required>
                  <option value="">Select Series</option>
                  {series.map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
                <input name="chapter_number" type="number" min="1" placeholder="Chapter number" value={form.chapter_number} onChange={updateForm} required />
                <input name="title" placeholder="Chapter title" value={form.title} onChange={updateForm} required />
                <input name="slug" placeholder="URL slug" value={form.slug} onChange={updateForm} required />
                <textarea name="story_content" placeholder="Chapter story content" value={form.story_content} onChange={updateForm} />
                <input name="cover_image" placeholder="Cover image URL" value={form.cover_image} onChange={updateForm} />
              </>
            )}

            {section === "products" && (
              <>
                <input name="name" placeholder="Product name" value={form.name} onChange={updateForm} required />
                <textarea name="description" placeholder="Product description" value={form.description} onChange={updateForm} />
                <input name="price" type="number" min="0" step="0.01" placeholder="Price" value={form.price} onChange={updateForm} required />
                <input name="image_url" placeholder="Product image URL" value={form.image_url} onChange={updateForm} />
              </>
            )}

            <div className="admin-form-actions">
              <button type="submit">{editingId ? "Update" : "Save"} {section}</button>
              <button type="button" onClick={resetForm}>Clear</button>
            </div>
          </form>
        </section>

        <section className="admin-list-card">
          <h2>Existing {section}</h2>

          {items.map(item => (
            <div className="admin-list-item" key={item.id}>
              <div>
                <strong>
                  {section === "products" ? item.name : item.title}
                </strong>
                <p>
                  {section === "products"
                    ? `₹${item.price}`
                    : section === "chapters"
                    ? `Chapter ${item.chapter_number}`
                    : item.status}
                </p>
              </div>

              <div className="admin-item-actions">
                <button onClick={() => editItem(item)}>Edit</button>
                <button onClick={() => deleteItem(item.id)}>Delete</button>
              </div>
            </div>
          ))}

          {items.length === 0 && <p>No items found.</p>}
        </section>
      </main>
    </div>
  );
}
