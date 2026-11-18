# LeatherCAD 🧥✨ (Python Django + React Tech Stack)

**LeatherCAD** is a premium web platform for designing and ordering custom leather products. It bridges the gap between digital customization and manufacturing, featuring real-time 3D configuration, user role management, and an admin dashboard for order and design oversight.

---

## 🛠️ Technology Stack

*   **Backend**: **Python Django 6.1**, **Django REST Framework (DRF)**, **ReportLab** (Tech Pack PDF Generation), **Google Generative AI** (Palette Generator).
*   **Database**: SQLite (Zero-config development) / PostgreSQL ready with Django ORM.
*   **Admin Panel**: Native Django Admin (`/admin/`) + Custom React Admin Dashboard (`/admin`).
*   **Frontend**: React (Vite), Three.js / React Three Fiber (3D WebGL Customizer), Tailwind CSS, Lucide React, Recharts.
*   **Authentication**: Custom JWT + Clerk Support + Dev Bypass (`dev-admin-token`).

---

## 🚀 Getting Started

### 1. Prerequisites
*   Python 3.10+
*   Node.js 18+

### 2. Setup Virtual Environment & Dependencies

```bash
# Activate virtual environment
# Windows:
.\.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# Install Python requirements
pip install -r requirements.txt

# Install frontend dependencies
npm install
```

### 3. Database Migration & Seeding

```bash
# Run Django migrations
python manage.py migrate

# Seed catalog products, users, designs, materials, and projects
python manage.py seed_data
```

Seeded credentials:
*   **Admin**: `kailash@example.com` / `password123`
*   **Designer**: `siddhant@example.com` / `password123`
*   **User**: `varsha@example.com` / `password123`

### 4. Running the Application

You can start both backend and frontend concurrently:

```bash
npm start
```

Or run them individually:

*   **Django Backend Server** (Port 8000):
    ```bash
    python manage.py runserver 8000
    ```
    API Root: `http://localhost:8000/api/`  
    Django Admin: `http://localhost:8000/admin/`

*   **React Frontend** (Port 5173):
    ```bash
    npm run dev
    ```
    Frontend App: `http://localhost:5173`

---

## 🎨 Key Features & Architecture

*   **3D Customizer**: Real-time 3D configuration of jackets, bags, boots, belts, and wallets with Three.js.
*   **AI Design Palette**: Natural language design prompt translated to color configurations via Google Gemini.
*   **Production Tech Pack Export**: Automatically compiles Bill of Materials (BOM) into downloadable PDF specifications via ReportLab.
*   **Django Admin Dashboard**: Built-in superuser controls at `/admin/` for products, orders, projects, and users.
*   **Zero-Breakage Backward Compatibility**: Serializers provide both `id` and `_id` and maintain all legacy API routes.
