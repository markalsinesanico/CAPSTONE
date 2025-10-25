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
    <div class="main">
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

      <!-- Item Section -->
      <section class="item-section">
        <div class="item-header">
          <h2>Available Items</h2>
          <button @click="openModal('add')">+ Add</button>
        </div>
        <div class="item-list">
          <div v-for="item in items" :key="item.id" class="item">
            <div class="item-info">
              <img :src="getImageUrl(item)" alt="" />
              <div>
                <div class="item-name">{{ item.name }}</div>
                <div class="item-quantity">Qty: {{ item.qty }}</div>
                <div class="item-description">{{ item.description }}</div>
              </div>
            </div>
            <div class="item-actions">
              <button class="edit-btn" @click="openModal('edit', item)">EDIT</button>
              <button class="request-btn" @click="openModal('request', item)">Request ITEM</button>
              <!-- QR CODE removed -->
              <button class="delete-btn" @click="deleteItem(item.id)">DELETE</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Borrower Table -->
      <section class="borrower-section">
        <div class="search-bar">
          <input v-model="search" placeholder="Search Borrowers..." />
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>ID</th>
              <th>Year</th>
              <th>Department</th>
              <th>Course</th>
              <th>Date</th>
              <th>Time In</th>
              <th>Time Out</th>
              <th>Item</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(borrower, index) in filteredBorrowers" :key="borrower.id">
              <td>{{ index + 1 }}</td>
              <td>{{ borrower.name }}</td>
              <td>{{ borrower.borrower_id }}</td>
              <td>{{ borrower.year }}</td>
              <td>{{ borrower.department }}</td>
              <td>{{ borrower.course }}</td>
              <td>{{ formatDate(borrower.date) }}</td>
             <td>{{ formatTime(borrower.time_in) }}</td>
            <td>{{ formatTime(borrower.time_out) }}</td>
              <td>{{ borrower.item?.name || 'N/A' }}</td>
              <td>
                <button class="cancel-btn" @click="cancelRequest(borrower.id)">
                  ❌ Cancel
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal" @click.self="closeModal">
      <div class="modal-content">
        <span class="close" @click="closeModal">&times;</span>
        <h3>{{ modalTitle }}</h3>
        <form @submit.prevent="handleSubmit">
          <div class="modal-form">
            <!-- Add/Edit Item -->
            <template v-if="modalType === 'add' || modalType === 'edit'">
              <label>
                <span>📦 Item Name</span>
                <input v-model="form.name" placeholder="Enter item name" required />
              </label>
              <label>
                <span>🔢 Quantity</span>
                <input v-model.number="form.qty" type="number" placeholder="Enter quantity" required />
              </label>
              <label>
                <span>🖼️ Upload Image</span>
                <input type="file" accept="image/*" @change="handleImageUpload" />
                <img v-if="form.imagePreview" :src="form.imagePreview" alt="Preview" class="image-preview" />
              </label>
              <label>
                <span>📝 Description</span>
                <textarea v-model="form.description" placeholder="Enter description"></textarea>
              </label>
            </template>

            <!-- Request Item -->
            <template v-else-if="modalType === 'request'">
              <label>
                <span>👤 Full Name</span>
                <input v-model="form.name" placeholder="Enter your name" required />
              </label>
              <label>
                <span>🆔 ID Number</span>
                <input v-model="form.id" placeholder="Enter ID number" required />
              </label>

              <label>
                <span>📅 Year</span>
                <select v-model="form.year" required>
                  <option disabled value="">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </label>

              <label>
                <span>🏫 Department</span>
                <select v-model="form.dept" @change="updateCourseOptions" required>
                  <option disabled value="">Select Department</option>
                  <option value="CEIT">CEIT</option>
                  <option value="CTE">CTE</option>
                  <option value="COT">COT</option>
                  <option value="CAS">CAS</option>
                </select>
              </label>

              <label>
                <span>📚 Course</span>
                <select v-model="form.course" required>
                  <option disabled value="">Select Course</option>
                  <option v-for="c in courseOptions" :key="c.value" :value="c.value">
                    {{ c.label }}
                  </option>
                </select>
              </label>

              <label>
                <span>📅 Date</span>
                <input v-model="form.date" type="date" required />
              </label>
              <label>
                <span>⏰ Time In</span>
                <input v-model="form.timeIn" type="time" required />
              </label>
              <label>
                <span>⏳ Time Out</span>
                <input v-model="form.timeOut" type="time" required />
              </label>
              <label>
                <span>🧰 Item</span>
                <input v-model="form.item" readonly />
              </label>
            </template>
          </div>
          <button type="submit" class="submit-btn">✔ Submit</button>
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

    <!-- QR Code Modal removed -->
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "Dashboard",
  data() {
    return {
      userEmail: "msanico@ssct.edu.ph",
      items: [],
      borrowers: [],
      search: "",
      showModal: false,
      modalType: "",
      currentItem: null,
      form: {},
      loading: false,
      courseOptions: [],
  // QR code state removed
      
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
      }
    };
  },
  computed: {
    modalTitle() {
      return {
        add: "Add New Item",
        edit: "Edit Item",
        request: "Request Item",
      }[this.modalType];
    },
    filteredBorrowers() {
      return this.borrowers.filter(b =>
        b.name?.toLowerCase().includes(this.search.toLowerCase()) &&
        !b.returned // Filter out returned items
      );
    },
  },
  mounted() {
    this.fetchItems();
    this.fetchBorrowers();

    // Get user email from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.email) {
      this.userEmail = user.email;
    }
  },
  methods: {
    updateCourseOptions() {
      this.courseOptions = this.DEPARTMENT_COURSES[this.form.dept] || [];
      this.form.course = "";
    },
    async fetchItems() {
      this.loading = true;
      try {
        const res = await axios.get("/api/items");
        this.items = res.data;
      } catch {
        alert("Failed to fetch items.");
      }
      this.loading = false;
    },
     formatTime(time) {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours, 10);
    const suffix = h >= 12 ? "PM" : "AM";
    const formattedHour = ((h + 11) % 12 + 1); // convert to 12-hour format
    return `${formattedHour}:${minutes} ${suffix}`;
  },
  formatDate(dateString) {
    if (!dateString) return "";
    // Remove time portion and format as YYYY-MM-DD
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  },
  
    async fetchBorrowers() {
      try {
        const res = await axios.get("/api/requests");
        this.borrowers = res.data;
      } catch {
        alert("Failed to fetch requests.");
      }
    },
    openModal(type, item = null) {
      this.modalType = type;
      this.currentItem = item;
      this.showModal = true;

      if (type === "edit" && item) {
        this.form = { ...item, image: null };
      } else if (type === "request") {
        this.form = {
          name: "",
          id: "",
          year: "",
          dept: "",
          course: "",
          date: "",
          timeIn: "",
          timeOut: "",
          item: item?.name || "",
        };
        this.courseOptions = [];
      } else {
        this.form = { name: "", qty: "", image: null, description: "" };
      }
    },
    closeModal() {
      this.showModal = false;
      this.form = {};
      this.currentItem = null;
    },
    async handleSubmit() {
      if (this.modalType === "request") {
        try {
          const item = this.items.find(i => i.name === this.form.item);
          if (!item) throw new Error("Item not found.");

          // Check slot availability
          const available = this.isSlotAvailable(
            item.name,
            this.form.date,
            this.form.timeIn,
            this.form.timeOut
          );
          if (!available) {
            alert("This item is no longer available for the selected time slot.");
            return;
          }

          await axios.post("/api/requests", {
            name: this.form.name,
            borrower_id: this.form.id,
            year: this.form.year,
            department: this.form.dept,
            course: this.form.course,
            date: this.form.date,
            time_in: this.form.timeIn,
            time_out: this.form.timeOut,
            item_id: item.id,
          });
          this.closeModal();
          alert("Request submitted!");
          this.fetchBorrowers();
        } catch (e) {
          alert("The request time is full.");
          console.error(e);
        }
      } else if (this.modalType === "add") {
        await this.addItem();
      } else if (this.modalType === "edit") {
        await this.editItem();
      }
    },
    async addItem() {
      try {
        const formData = new FormData();
        formData.append("name", this.form.name);
        formData.append("qty", this.form.qty);
        formData.append("description", this.form.description || "");
        if (this.form.image instanceof File) {
          formData.append("image", this.form.image);
        }
        await axios.post("/api/items", formData);
        this.fetchItems();
        this.closeModal();
      } catch (e) {
        alert("Failed to add item.");
        console.error(e);
      }
    },
    async editItem() {
      try {
        const formData = new FormData();
        formData.append("name", this.form.name);
        formData.append("qty", this.form.qty);
        formData.append("description", this.form.description || "");
        if (this.form.image instanceof File) {
          formData.append("image", this.form.image);
        }
        await axios.post(`/api/items/${this.currentItem.id}?_method=PUT`, formData);
        this.fetchItems();
        this.closeModal();
      } catch {
        alert("Failed to update item.");
      }
    },
    handleImageUpload(event) {
      const file = event.target.files[0];
      if (file && file.type.startsWith("image/")) {
        this.form.image = file;
        const reader = new FileReader();
        reader.onload = e => {
          this.form.imagePreview = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        alert("Please upload a valid image file.");
      }
    },
    async deleteItem(id) {
      if (!confirm("Are you sure you want to delete this item?")) return;
      try {
        await axios.delete(`/api/items/${id}`);
        this.fetchItems();
      } catch {
        alert("Failed to delete item.");
      }
    },
    async deleteBorrower(index) {
      const borrower = this.filteredBorrowers[index];
      if (!borrower || !borrower.id) return;
      if (!confirm("Are you sure you want to delete this request?")) return;
      try {
        await axios.delete(`/api/requests/${borrower.id}`);
        this.fetchBorrowers();
      } catch {
        alert("Failed to delete request.");
      }
    },
    cancelRequest(id) {
      this.requestToCancel = id;
      this.confirmItemType = 'equipment request';
      this.showConfirmDialog = true;
    },
    async confirmCancel() {
      if (!this.requestToCancel) return;
      
      try {
        await axios.delete(`/api/requests/${this.requestToCancel}`);
        this.showCustomAlert('success', 'Success!', 'Equipment request cancelled successfully!');
        this.fetchBorrowers();
        this.closeConfirmDialog();
      } catch (error) {
        console.error("Failed to cancel request:", error);
        this.showCustomAlert('error', 'Error!', 'Failed to cancel request. Please try again.');
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
    getImageUrl(item) {
      return item.image_url || "/img/no-image.png";
    },
    isSlotAvailable(itemName, date, timeIn, timeOut) {
      // Find the item to get its quantity
      const item = this.items.find(i => i.name === itemName);
      if (!item) return false;

      // Count overlapping requests for this item and time slot
      const overlapping = this.borrowers.filter(b =>
        b.item?.name === itemName &&
        b.date === date &&
        (
          // Check if requested time overlaps with existing request
          (timeIn < b.time_out && timeOut > b.time_in)
        )
      ).length;

      return overlapping < item.qty;
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
    // QR code methods removed
  },
};
</script>

<style scoped>


   * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Roboto', sans-serif;
    }

    body {
      background: #f5f5f5;
    }

    .container {
      display: flex;
  flex-direction: row;
  min-height: 100vh;
  min-width: 100vw;
    }

    .sidebar {
     width: 220px;
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

.menu {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

.menu a {
  color: white;
  text-decoration: none;
  font-size: 16px;
  padding: 10px 15px;
  border-radius: 8px;
  transition: background 0.3s, color 0.3s;
}

.menu a.active,
.menu a:hover {
  background-color: #18bc9c;
  color: #ffffff;
}

    .main {
          flex: 1;
      padding: 20px;
      display: flex;
      flex-direction: column;
      width: 100%;
      margin-left: 220px; /* account for fixed sidebar width */
      min-height: 100vh; /* ensure main area provides its own scroll */
    }

    .topbar {
    position: sticky;   /* stays visible while scrolling */
  top: 0;             /* sticks to the top */
  z-index: 1000;      /* ensures it stays above content */
  background-color: #007e3a;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  padding: 10px 20px;
  color: white;
  border-radius: 8px;
    }

    .topbar .logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .topbar .logo img {
      height: 50px;
    }

    .topbar .logo-text h2 {
      font-size: 18px;
      color: white;
      margin: 0;
    }

    .topbar .logo-text p {
      font-size: 12px;
      color: white;
      margin: 0;
    }

    .topbar .user {
      background: rgba(255, 255, 255, 0.2);
      padding: 8px 12px;
      border-radius: 20px;
      color: white;
      font-weight: bold;
    }

    .item-section, .borrower-section {
      margin-top: 20px;
      background: #fff;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .item-header button {
      padding: 8px 16px;
      background: #2ecc71;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }

    .item-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px;
      border-bottom: 1px solid #eee;
    }

    .item img {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 8px;
    }

    .item-info {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .item-name {
      font-size: 20px;
      font-weight: bold;
    }

    .item-quantity {
      color: green;
      font-size: 18px;
    }

    .item-actions button {
      margin: 0 5px;
      padding: 6px 12px;
      border: none;
      border-radius: 5px;
      color: white;
      cursor: pointer;
    }

    .edit-btn { background-color: #007bff; }
    .request-btn { background-color: #28a745; }
    .qr-btn { background-color: #6f42c1; }
    .delete-btn { background-color: #dc3545; }
    .receipt-btn { 
      background-color: #17a2b8; 
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
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

    .borrower-section .search-bar {
      margin-bottom: 15px;
      display: flex;
      justify-content: flex-end;
    }

    .search-bar input {
      padding: 8px 12px;
      width: 300px;
      border-radius: 20px;
      border: 1px solid #ccc;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    table th, table td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
      text-align: center;
    }

    .status-btn {
      padding: 6px 10px;
      border: none;
      border-radius: 5px;
      color: white;
      cursor: pointer;
    }

    .approve-btn { background-color: #28a745; }
    .cancel-btn { background-color: #dc3545; }

    .modal {
      position: fixed;
      z-index: 999;
      left: 0; top: 0;
      width: 100%; height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    }

   .modal-content {
  background-color: white;
  padding: 30px 24px 24px 24px;
  border-radius: 14px;
  width: 90%; /* more responsive on small screens */
  max-width: 500px; /* limit width on big screens */
  max-height: 90vh; /* prevent going off screen */
  overflow-y: auto; /* scroll if content is taller */
  position: relative;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
}

    .close {
      position: absolute;
      right: 20px;
      top: 10px;
      font-size: 22px;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .container {
        flex-direction: column;
      }

      .sidebar {
        flex-direction: row;
        width: 100%;
        padding: 10px;
        justify-content: space-around;
      }

      .menu {
        display: flex;
        gap: 10px;
      }

      .menu a {
        font-size: 14px;
        padding: 6px 10px;
      }

      .topbar {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
    }
    .modal-form label {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  font-size: 15px;
  color: #333;
}

.modal-form label span {
  margin-bottom: 5px;
  font-weight: bold;
}

.modal-form input, .modal-form select, .modal-form textarea {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 15px;
}

.image-preview {
  margin-top: 8px;
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}
.submit-btn {
  background-color: #007e3a;
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  width: 100%;
  margin-top: 10px;
  transition: background 0.3s ease;
}
.submit-btn:hover {
  background-color: #00632e;
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

/* QR styles removed */

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
