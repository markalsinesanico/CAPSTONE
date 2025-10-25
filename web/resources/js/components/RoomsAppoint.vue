<template>
  <div class="container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <nav class="menu">
        <router-link to="/dashboard">DASHBOARD</router-link>
        <router-link to="/borrowers">BORROWERS</router-link>
        <router-link to="/appointment">APPOINTMENT</router-link>
        <router-link to="/history">HISTORY</router-link>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="main">
      <!-- Topbar -->
      <header class="topbar">
        <div class="logo">
          <img src="/img/logo.png" alt="Logo" />
          <div class="logo-text">
            <h2>SMART LINK</h2>
            <p>APPOINT & BORROW</p>
          </div>
        </div>
        <div class="user">
          M {{ userEmail }}
          <button @click="logout" class="logout-btn">Logout</button>
        </div>
      </header>

      <!-- Rooms Section -->
      <section class="item-section">
        <div class="item-header">
          <h2>Available Rooms</h2>
          <button @click="openRoomModal('add')">+ Add Room</button>
        </div>

        <div class="item-list">
          <div class="item" v-for="room in rooms" :key="room.id">
            <div class="item-info">
              <div>
                <div class="item-name">{{ room.name }}</div>
                <div class="item-quantity">Qty: {{ room.quantity }}</div>
              </div>
            </div>
            <div class="item-actions">
              <button class="edit-btn" @click="openRoomModal('edit', room)">EDIT</button>
              <button class="request-btn" @click="openRequestRoomModal(room)">Request Room</button>
              <button class="delete-btn" @click="deleteRoom(room.id)">DELETE</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Requests Table -->
      <section class="borrower-section">
        <div class="search-bar">
          <input type="text" placeholder="Search requester or course..." v-model="search" />
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>ID</th>
              <th>Year</th>
              <th>Dept</th>
              <th>Course</th>
              <th>Room</th>
              <th>Date</th>
              <th>IN</th>
              <th>OUT</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in filteredRoomRequests" :key="r.id">
              <td>{{ i + 1 }}</td>
              <td>{{ r.name }}</td>
              <td>{{ r.borrower_id }}</td>
              <td>{{ r.year }}</td>
              <td>{{ r.department }}</td>
              <td>{{ r.course }}</td>
              <td>{{ r.room?.name || '—' }}</td>
              <td>{{ formatDate(r.date) }}</td>
              <td>{{ formatTime(r.time_in) }}</td>
              <td>{{ formatTime(r.time_out) }}</td>
              <td>
                <button class="cancel-btn" @click="cancelRoomRequest(r.id)">
                  ❌ Cancel
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>

    <!-- Room CRUD Modal -->
    <div v-if="showRoomModal" class="modal" @click.self="closeRoomModal">
      <div class="modal-content">
        <span class="close" @click="closeRoomModal">&times;</span>
        <h3>{{ roomModalType === 'add' ? 'Add Room' : 'Edit Room' }}</h3>
        <form @submit.prevent="handleRoomSubmit">
          <div class="modal-form">
            <label>
              <span>🏢 Room Name</span>
              <input v-model.trim="roomForm.name" placeholder="Enter room name" required />
            </label>
            <label>
              <span>🔢 Quantity</span>
              <input v-model.number="roomForm.quantity" type="number" min="1" placeholder="Enter quantity" required />
            </label>
          </div>
          <button type="submit" class="submit-btn" :disabled="submitting">
            {{ submitting ? 'Please wait…' : '✔ Submit' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Custom Alert System -->
    <div v-if="showAlert" class="custom-alert" :class="alertType">
      <div class="alert-content">
        <div class="alert-icon">
          <span v-if="alertType === 'success'">✅</span>
          <span v-else-if="alertType === 'error'">❌</span>
          <span v-else-if="alertType === 'warning'">⚠️</span>
          <span v-else>ℹ️</span>
        </div>
        <div class="alert-message">
          <h4>{{ alertTitle }}</h4>
          <p>{{ alertMessage }}</p>
        </div>
        <button class="alert-close" @click="closeAlert">&times;</button>
      </div>
    </div>

    <!-- Custom Confirmation Dialog -->
    <div v-if="showConfirmDialog" class="confirmation-overlay" @click.self="closeConfirmDialog">
      <div class="confirmation-dialog">
        <div class="confirmation-header">
          <div class="confirmation-icon">
            <span>⚠️</span>
          </div>
          <h3>Confirm Cancellation</h3>
        </div>
        <div class="confirmation-body">
          <p>Are you sure you want to cancel this <strong>{{ confirmItemType }}</strong>?</p>
          <p class="confirmation-warning">This action cannot be undone.</p>
        </div>
        <div class="confirmation-actions">
          <button class="btn-cancel" @click="closeConfirmDialog">Cancel</button>
          <button class="btn-delete" @click="confirmCancel">Yes, Cancel</button>
        </div>
      </div>
    </div>

    <!-- Request Room Modal -->
    <div v-if="showRequestRoomModal" class="modal" @click.self="closeRequestRoomModal">
      <div class="modal-content modal-content--lg">
        <span class="close" @click="closeRequestRoomModal">&times;</span>
        <h3>Request Room</h3>
        <form @submit.prevent="submitRoomRequest">
          <div class="modal-form modal-grid">
            <label>
              <span>👤 Full Name</span>
              <input v-model.trim="requestForm.name" placeholder="Enter your name" required />
            </label>
            <label>
              <span>🆔 ID Number</span>
              <input v-model.trim="requestForm.borrower_id" placeholder="Enter ID number" required />
            </label>

            <label>
              <span>📅 Year</span>
              <select v-model="requestForm.year" required>
                <option disabled value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </label>

            <label>
              <span>🏫 Department</span>
              <select v-model="requestForm.department" @change="onDeptChange" required>
                <option disabled value="">Select Department</option>
                <option value="CEIT">CEIT</option>
                <option value="CTE">CTE</option>
                <option value="COT">COT</option>
                <option value="CAS">CAS</option>
              </select>
            </label>

            <label class="full">
              <span>📚 Course</span>
              <select v-model="requestForm.course" required>
                <option disabled value="">Select Course</option>
                <option v-for="c in courseOptions" :key="c.value" :value="c.value">
                  {{ c.label }}
                </option>
              </select>
            </label>

            <label>
              <span>📆 Date</span>
              <input
                v-model="requestForm.date"
                type="date"
                required
                @input="onDateInput"
                style="background-color: white !important; color: #333 !important;"
              />
            </label>
            <label>
              <span>⏰ Time In</span>
              <input v-model="requestForm.time_in" type="time" required />
            </label>
            <label>
              <span>⏳ Time Out</span>
              <input v-model="requestForm.time_out" type="time" required />
            </label>

            <label class="full">
              <span>🏢 Room</span>
              <input :value="activeRoom?.name || ''" readonly />
            </label>
          </div>

          <button type="submit" class="submit-btn" :disabled="submitting">
            {{ submitting ? 'Submitting…' : '✔ Submit' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
});

export default {
  name: "RoomsDashboard",
  data() {
    return {
      userEmail: "msanico@ssct.edu.ph",
      rooms: [],
      roomRequests: [],
      search: "",

      // Room CRUD modal
      showRoomModal: false,
      roomModalType: "add",
      roomForm: { name: "", quantity: 1 },
      editRoomId: null,

      // Request Room modal
      showRequestRoomModal: false,
      activeRoom: null,
      submitting: false,
      requestForm: {
        name: "",
        borrower_id: "",
        year: "",
        department: "",
        course: "",
        date: "",
        time_in: "",
        time_out: "",
        room_id: null,
      },

      courseOptions: [],
      
      // Custom Alert System
      showAlert: false,
      alertType: 'info', // success, error, warning, info
      alertTitle: '',
      alertMessage: '',
      
      // Custom Confirmation Dialog
      showConfirmDialog: false,
      confirmItemType: '',
      requestToCancel: null,
      
      DEPARTMENT_COURSES: {
        CEIT: [
          { label: 'Bachelor of Science in Electronics (BSECE)', value: 'BSECE' },
          { label: 'Bachelor of Science in Electrical (BSEE)', value: 'BSEE' },
          { label: 'Bachelor of Science in Computer (BSCoE)', value: 'BSCoE' },
          { label: 'Bachelor of Science in Information Systems (BSIS)', value: 'BSIS' },
          { label: 'Bachelor of Science in Information Technology (BSInfoTech)', value: 'BSInfoTech' },
          { label: 'Bachelor of Science in Computer Science (BSCS)', value: 'BSCS' },
        ],
        CTE: [
          { label: 'BSED - English', value: 'BSED-ENGLISH' },
          { label: 'BSED - Filipino', value: 'BSED-FILIPINO' },
          { label: 'BSED - Mathematics', value: 'BSED-MATH' },
          { label: 'BSED - Sciences', value: 'BSED-SCIENCES' },
          { label: 'BEED', value: 'BEED' },
          { label: 'BPED', value: 'BPED' },
          { label: 'BTVTED', value: 'BTVTED' },
        ],
        COT: [
          { label: 'Bachelor in Electrical (BEET)', value: 'BEET' },
          { label: 'Bachelor in Electronics (BEXET)', value: 'BEXET' },
          { label: 'Bachelor in Mechanical (BMET)', value: 'BMET' },
          { label: 'Mechanical Technology (BMET-MT)', value: 'BMET-MT' },
          { label: 'Refrigeration & AC (BMET-RAC)', value: 'BMET-RAC' },
          { label: 'Architectural Drafting (BSIT-ADT)', value: 'BSIT-ADT' },
          { label: 'Automotive Technology (BSIT-AT)', value: 'BSIT-AT' },
          { label: 'Electrical Technology (BSIT-ELT)', value: 'BSIT-ELT' },
          { label: 'Electronics Technology (BSIT-ET)', value: 'BSIT-ET' },
          { label: 'Mechanical Technology (BSIT-MT)', value: 'BSIT-MT' },
          { label: 'Welding & Fabrication (BSIT-WAF)', value: 'BSIT-WAF' },
          { label: 'Heating, Ventilation, AC & Refrigeration (BSIT-HVACR)', value: 'BSIT-HVACR' },
        ],
        CAS: [
          { label: 'Bachelor of Science in Environmental Science (BSES)', value: 'BSES' },
          { label: 'Bachelor of Science in Mathematics (BSMATH)', value: 'BSMATH' },
          { label: 'Bachelor of Arts in English Language (BA-EL)', value: 'BA-EL' },
        ],
      },
    };
  },
  computed: {
    filteredRoomRequests() {
      const q = this.search.toLowerCase();
      return this.roomRequests.filter(r =>
        ((r.name || '').toLowerCase().includes(q) ||
        (r.course || '').toLowerCase().includes(q)) &&
        !r.returned // Filter out returned room requests
      );
    },
  },
  created() {
    this.fetchRooms();
    this.fetchRoomRequests();
  },
  methods: {
    // --- options ---
    onDeptChange() {
      this.courseOptions = this.DEPARTMENT_COURSES[this.requestForm.department] || [];
      this.requestForm.course = "";
    },
    onDateInput(e) {
      const val = e.target.value;
      if (!val) return;
      // set the ISO date (YYYY-MM-DD) directly to the form
      this.requestForm.date = val;
    },

    // --- rooms ---
    async fetchRooms() {
      try {
        const { data } = await api.get("/api/rooms");
        this.rooms = data;
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
        alert("Could not load rooms.");
      }
    },
    openRoomModal(type, room = null) {
      this.roomModalType = type;
      this.showRoomModal = true;

      if (type === "edit" && room) {
        this.editRoomId = room.id;
        this.roomForm = { name: room.name, quantity: room.quantity };
      } else {
        this.editRoomId = null;
        this.roomForm = { name: "", quantity: 1 };
      }
    },
    closeRoomModal() {
      this.showRoomModal = false;
      this.editRoomId = null;
      this.roomForm = { name: "", quantity: 1 };
      this.submitting = false;
    },
    async handleRoomSubmit() {
      if (!this.roomForm.name || !this.roomForm.quantity) return;
      this.submitting = true;
      try {
        if (this.roomModalType === "add") {
          const { data } = await api.post("/api/rooms", { ...this.roomForm });
          this.rooms.unshift(data);
        } else if (this.roomModalType === "edit" && this.editRoomId) {
          const { data } = await api.put(`/api/rooms/${this.editRoomId}`, { ...this.roomForm });
          const idx = this.rooms.findIndex((r) => r.id === this.editRoomId);
          if (idx !== -1) this.rooms.splice(idx, 1, data);
        }
        this.closeRoomModal();
      } catch (err) {
        console.error("Save failed:", err);
        alert(err?.response?.data?.message || "Failed to save room.");
        this.submitting = false;
      }
    },
    async deleteRoom(id) {
      if (!confirm("Are you sure you want to delete this room?")) return;
      try {
        await api.delete(`/api/rooms/${id}`);
        this.rooms = this.rooms.filter((r) => r.id !== id);
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete room.");
      }
    },

    // --- requests ---
    openRequestRoomModal(room) {
      this.activeRoom = room;
      this.showRequestRoomModal = true;
      this.requestForm = {
        name: "",
        borrower_id: "",
        year: "",
        department: "",
        course: "",
        date: "",
        time_in: "",
        time_out: "",
        room_id: room.id,
      };
      this.courseOptions = [];
    },
    closeRequestRoomModal() {
      this.showRequestRoomModal = false;
      this.activeRoom = null;
    },
    async fetchRoomRequests() {
      try {
        const { data } = await api.get("/api/room-requests");
        this.roomRequests = data;
      } catch (err) {
        console.error("Failed to fetch requests:", err);
      }
    },
    // helper moved into methods so template can access it
    formatTime(time) {
      if (!time) return '';
      // time expected as 'HH:mm' or 'HH:mm:ss'
      const parts = String(time).split(':');
      let hour = parseInt(parts[0], 10);
      const minute = (parts[1] || '00').padStart(2, '0');
      const suffix = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12 || 12;
      return `${hour}:${minute} ${suffix}`;
    },
    // format ISO datetime strings by stripping the time component
    formatDate(d) {
      if (!d) return '';
      let s = String(d).trim();
      // if it's an ISO datetime like 2025-09-27T00:00:00.000000Z, take the date part
      if (s.includes('T')) return s.split('T')[0];
      // if it's a full ISO with space, try splitting by space
      if (s.includes(' ')) return s.split(' ')[0];
      return s;
    },
    async submitRoomRequest() {
      this.submitting = true;
      try {
        await api.post("/api/room-requests", { ...this.requestForm });
        this.submitting = false;
        this.closeRequestRoomModal();
        alert("Room request submitted!");
        this.fetchRoomRequests();
      } catch (err) {
        this.submitting = false;
        const msg = err?.response?.data?.message || "Failed to submit request.";
        alert(msg);
        console.error(err);
      }
    },
    cancelRoomRequest(id) {
      this.requestToCancel = id;
      this.confirmItemType = 'room request';
      this.showConfirmDialog = true;
    },
    async confirmCancel() {
      if (!this.requestToCancel) return;
      
      try {
        await api.delete(`/api/room-requests/${this.requestToCancel}`);
        this.showCustomAlert('success', 'Success!', 'Room request cancelled successfully!');
        this.fetchRoomRequests();
        this.closeConfirmDialog();
      } catch (error) {
        console.error("Failed to cancel room request:", error);
        this.showCustomAlert('error', 'Error!', 'Failed to cancel room request. Please try again.');
        this.closeConfirmDialog();
      }
    },
    closeConfirmDialog() {
      this.showConfirmDialog = false;
      this.requestToCancel = null;
      this.confirmItemType = '';
    },
    
    // Custom Alert Methods
    showCustomAlert(type, title, message, duration = 5000) {
      this.alertType = type;
      this.alertTitle = title;
      this.alertMessage = message;
      this.showAlert = true;
      
      // Auto-hide after duration
      if (duration > 0) {
        setTimeout(() => {
          this.closeAlert();
        }, duration);
      }
    },
    closeAlert() {
      this.showAlert = false;
    },
    async logout() {
      try {
        await axios.post('/api/logout');
      } catch (e) {
        // ignore errors
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      this.$router.push('/');
    },
  },
  mounted() {
    // Get user email from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.email) {
      this.userEmail = user.email;
    }
  }
};
</script>

<style scoped>
/* --- (existing styles kept) --- */

* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Roboto', sans-serif; }
body { background: #f5f5f5; }
.container { display: flex; flex-direction: row; min-height: 100vh; min-width: 100vw; }
.sidebar {   width: 220px;
      background: #2c3e50;
      color: white;
      display: flex;
      flex-direction: column;
      padding: 30px 20px;
      box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
      flex-shrink: 0;
      position: fixed; /* keep sidebar fixed while main scrolls */
      top: 0;
      left: 0;
      height: 100vh;
      overflow-y: auto; /* allow sidebar to scroll if content overflows */
      z-index: 1000;
     }
.menu { display: flex; flex-direction: column; gap: 15px; margin-top: 20px; }
.menu a { color: white; text-decoration: none; font-size: 16px; padding: 10px 15px; border-radius: 8px; transition: background 0.3s, color 0.3s; }
.menu a.active, .menu a:hover { background-color: #18bc9c; color: #ffffff; }
.main {      flex: 1;
      padding: 20px;
      display: flex;
      flex-direction: column;
      width: 100%;
      margin-left: 220px; /* account for fixed sidebar width */
      min-height: 100vh; /* ensure main area provides its own scroll */ }
.topbar { position: sticky;   /* stays visible while scrolling */
  top: 0;             /* sticks to the top */
  z-index: 1000;      /* ensures it stays above content */
  background-color: #007e3a;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  padding: 10px 20px;
  color: white;
  border-radius: 8px;}
  
.topbar .logo { display: flex; align-items: center; gap: 10px; }
.topbar .logo img { height: 50px; }
.topbar .logo-text h2 { font-size: 18px; color: white; margin: 0; }
.topbar .logo-text p { font-size: 12px; color: white; margin: 0; }
.topbar .user { background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 20px; color: white; font-weight: bold; }
.item-section, .borrower-section { margin-top: 20px; background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
.item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.item-header button { padding: 8px 16px; background: #2ecc71; color: white; border: none; border-radius: 5px; cursor: pointer; }
.item-list { display: flex; flex-direction: column; gap: 20px; }
.item { display: flex; align-items: center; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; }
.item-info { display: flex; align-items: center; gap: 20px; }
.item-name { font-size: 20px; font-weight: bold; }
.item-quantity { color: green; font-size: 18px; }
.item-actions button { margin: 0 5px; padding: 6px 12px; border: none; border-radius: 5px; color: white; cursor: pointer; }
.edit-btn { background-color: #007bff; }
.request-btn { background-color: #28a745; }
.delete-btn { background-color: #dc3545; }
.cancel-btn { 
  background-color: #dc3545; 
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}
.cancel-btn:hover {
  background-color: #c82333;
}

.borrower-section .search-bar { margin-bottom: 15px; display: flex; justify-content: flex-end; }
.search-bar input { padding: 8px 12px; width: 300px; border-radius: 20px; border: 1px solid #ccc; }
table { width: 100%; border-collapse: collapse; margin-top: 10px; }
table th, table td { padding: 10px; border-bottom: 1px solid #ddd; text-align: center; }

/* Modal shell */
.modal { position: fixed; z-index: 999; inset: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal-content { background-color: white; padding: 24px; border-radius: 14px; width: 400px; max-width: 95vw; position: relative; box-shadow: 0 4px 24px rgba(0,0,0,0.18); max-height: 90vh; overflow-y: auto; }
.modal-content--lg { width: 560px; max-width: 95vw; max-height: 90vh; overflow-y: auto; }
@media (min-width: 1024px) { .modal-content--lg { width: 720px; } }
.close { position: absolute; right: 16px; top: 10px; font-size: 22px; cursor: pointer; }

/* Form */
.modal-form label { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; font-size: 15px; color: #333; }
.modal-form input, .modal-form select, .modal-form textarea {
  padding: 10px; border: 1px solid #ccc; border-radius: 6px; font-size: 15px; width: 100%;
}
.submit-btn { background-color: #007e3a; color: white; padding: 10px 16px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; margin-top: 10px; transition: background 0.3s ease; }
.submit-btn:hover { background-color: #00632e; }

/* Two-column grid for large modal, falls back to 1 column on small screens */
.modal-grid { display: grid; grid-template-columns: 1fr; gap: 12px 16px; }
.modal-grid .full { grid-column: 1 / -1; }
@media (min-width: 640px) { .modal-grid { grid-template-columns: 1fr 1fr; } }

input[type="date"]:focus, input[type="date"]:active, input[type="date"] {
  background-color: white !important;
  color: #333 !important;
  outline: none !important;
  box-shadow: none !important;
}

.logout-btn {
  background: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 6px 12px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s;
  font-size: 12px;
}
.logout-btn:hover {
  background: #c0392b;
}

/* Custom Alert System */
.custom-alert {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  min-width: 300px;
  max-width: 400px;
  animation: slideInRight 0.3s ease-out;
}

.alert-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  position: relative;
}

.custom-alert.success .alert-content {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  border-left: 4px solid #28a745;
  color: #155724;
}

.custom-alert.error .alert-content {
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
  border-left: 4px solid #dc3545;
  color: #721c24;
}

.custom-alert.warning .alert-content {
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  border-left: 4px solid #ffc107;
  color: #856404;
}

.custom-alert.info .alert-content {
  background: linear-gradient(135deg, #d1ecf1, #bee5eb);
  border-left: 4px solid #17a2b8;
  color: #0c5460;
}

.alert-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-message {
  flex: 1;
}

.alert-message h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: bold;
}

.alert-message p {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

.alert-close {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.alert-close:hover {
  opacity: 1;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .custom-alert {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
    min-width: auto;
  }
}

/* Custom Confirmation Dialog */
.confirmation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  animation: fadeIn 0.3s ease-out;
}

.confirmation-dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
  animation: slideInUp 0.3s ease-out;
}

.confirmation-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px 16px 24px;
  border-bottom: 1px solid #e9ecef;
}

.confirmation-icon {
  font-size: 24px;
  color: #ffc107;
}

.confirmation-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: bold;
}

.confirmation-body {
  padding: 20px 24px;
}

.confirmation-body p {
  margin: 0 0 12px 0;
  color: #495057;
  font-size: 14px;
  line-height: 1.5;
}

.confirmation-warning {
  color: #dc3545 !important;
  font-weight: bold;
  font-size: 13px;
}

.confirmation-actions {
  display: flex;
  gap: 12px;
  padding: 16px 24px 24px 24px;
  justify-content: flex-end;
}

.btn-cancel, .btn-delete {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.btn-cancel {
  background-color: #6c757d;
  color: white;
}

.btn-cancel:hover {
  background-color: #5a6268;
  transform: translateY(-1px);
}

.btn-delete {
  background-color: #dc3545;
  color: white;
}

.btn-delete:hover {
  background-color: #c82333;
  transform: translateY(-1px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Mobile responsive for confirmation dialog */
@media (max-width: 768px) {
  .confirmation-dialog {
    margin: 20px;
    width: calc(100% - 40px);
  }
  
  .confirmation-actions {
    flex-direction: column;
  }
  
  .btn-cancel, .btn-delete {
    width: 100%;
  }
}
</style>
