# ISKCON Tour 2.0 - Pilgrimage Tour Management System

A modern, responsive, and real-time Pilgrimage Tour & Finance Management System designed for organizing pilgrimage yatras, managing pilgrim registrations, handling seat assignments, and tracking tour finances.

---

## ✨ Features

- **📊 Comprehensive Dashboard**: Real-time KPI metrics for total revenue, pilgrim registrations, tour capacity, and pending collections.
- **📝 Pilgrim Registration**:
  - Full registration workflow: Pilgrim Name, Gender, Date of Birth (DOB), Age (with auto-calculation from DOB), Contact numbers, Address, and Notes.
  - Direct optional seat assignment during registration.
  - Financial entry for agreed tour fee, advance paid, and automatic balance tracking.
- **👥 Passengers Roster**:
  - Real-time search and filter by tour, payment status, and pilgrim name.
  - In-place editing of passenger information and financial terms.
  - Secure deletion with confirmation modal and automatic financial ledger reconciliation.
  - Export capabilities for passenger lists.
- **🪑 Seat Allocation & Bus Manifest**:
  - Dedicated Seat Allocation view in the sidebar.
  - Roster view with columns: `Sl. No, Full Name, Gender, Age, Seat Number, Action`.
  - Direct manual seat entry with edit lock to prevent accidental modification (triple-click to unlock and reassign).
  - Printable Bus Seat Manifest with passenger details, emergency contacts, and boarding information.
- **💰 Financial Analytics**:
  - Breakdown of revenue, advances received, and outstanding dues per tour.
  - Individual balance receipts and tracking.
- **🚀 Live GitHub Pages Deployment**: Automated continuous deployment via GitHub Actions.

---

## 🛠️ Technology Stack

- **Frontend**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **CI/CD**: GitHub Actions deploying automatically to GitHub Pages

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/infoiskcondurgapur-design/tour-2.0.git
   cd tour-2.0
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000/
   ```

---

## 📦 Building for Production

To create an optimized production build:

```bash
npm run build
```

To locally preview the production build:

```bash
npm run preview
```

---

## 🌐 Deployment

This repository uses GitHub Actions (`.github/workflows/deploy.yml`) to automatically build and deploy changes to GitHub Pages whenever code is pushed to the `main` branch.

---

## 📄 License

Private & internal use for ISKCON Durgapur Pilgrimage Tour Management.
