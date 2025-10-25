<template>
  <div class="container">
    <aside class="sidebar">
      <nav class="menu">
        <router-link to="/dashboard">DASHBOARD</router-link>
        <router-link to="/borrowers">BORROWERS</router-link>
        <router-link to="/appointment">APPOINTMENT</router-link>
        <router-link to="/history">HISTORY</router-link>
      </nav>
    </aside>

    <main class="main">
      <header class="topbar">
        <div class="logo">
          <img src="/img/logo.png" alt="Logo" />
          <div class="logo-text">
            <h2>SMART LINK</h2>
            <p>APPOINT & BORROW</p>
          </div>
        </div>
        <div class="user">
          {{ userEmail }}
          <button @click="logout" class="logout-btn">Logout</button>
        </div>
      </header>

      <section class="content">
        <div class="history-header">
          <h2>Returned Items History</h2>
          <div class="filter-controls">
            <label for="typeFilter">Filter by Type:</label>
            <select id="typeFilter" v-model="typeFilter">
              <option value="all">All Items</option>
              <option value="equipment">Equipment</option>
              <option value="rooms">Rooms</option>
            </select>
            <input 
              type="text" 
              placeholder="Search by name, ID, or course..." 
              v-model="searchQuery"
              class="search-input"
            />
          </div>
        </div>

        <div class="history-content">
          <div v-if="filteredReturnedItems.length === 0" class="no-items">
            <p>No returned items found.</p>
          </div>
          
          <div v-else>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>ID</th>
                  <th>Year</th>
                  <th>Department</th>
                  <th>Course</th>
                  <th>Type</th>
                  <th>Item/Room</th>
                  <th>Date</th>
                  <th>Time In</th>
                  <th>Time Out</th>
                  <th>Returned</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in filteredReturnedItems" :key="`${item.source}-${item.id}`">
                  <td>{{ index + 1 }}</td>
                  <td>{{ item.name }}</td>
                  <td>{{ item.idnum }}</td>
                  <td>{{ item.year }}</td>
                  <td>{{ item.dept }}</td>
                  <td>{{ item.course }}</td>
                  <td>
                    <span class="item-type" :class="item.source">
                      {{ item.source === 'room' ? 'Room' : 'Equipment' }}
                    </span>
                  </td>
                  <td>{{ item.itemName }}</td>
                  <td>{{ formatDate(item.date) }}</td>
                  <td>{{ formatTime(item.time_in) }}</td>
                  <td>{{ formatTime(item.time_out) }}</td>
                  <td class="returned-date">{{ formatDate(item.returned_at) }}</td>
                  <td>
                    <button class="delete-btn" @click="deleteReturnedItem(item)">
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>

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
          <h3>Confirm Deletion</h3>
        </div>
        <div class="confirmation-body">
          <p>Are you sure you want to permanently delete this <strong>{{ confirmItemType }}</strong>?</p>
          <p class="confirmation-warning">This action cannot be undone.</p>
        </div>
        <div class="confirmation-actions">
          <button class="btn-cancel" @click="closeConfirmDialog">Cancel</button>
          <button class="btn-delete" @click="confirmDelete">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      returnedItems: [],
      typeFilter: 'all',
      searchQuery: '',
      userEmail: '',
      
      // Custom Alert System
      showAlert: false,
      alertType: 'info', // success, error, warning, info
      alertTitle: '',
      alertMessage: '',
      
      // Custom Confirmation Dialog
      showConfirmDialog: false,
      confirmItemType: '',
      itemToDelete: null
    };
  },
  computed: {
    filteredReturnedItems() {
      let filtered = this.returnedItems;
      
      // Filter by type
      if (this.typeFilter !== 'all') {
        filtered = filtered.filter(item => {
          if (this.typeFilter === 'equipment') return item.source === 'item';
          if (this.typeFilter === 'rooms') return item.source === 'room';
          return true;
        });
      }
      
      // Filter by search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(item => 
          item.name.toLowerCase().includes(query) ||
          item.idnum.toLowerCase().includes(query) ||
          item.course.toLowerCase().includes(query) ||
          item.dept.toLowerCase().includes(query)
        );
      }
      
      // Sort by returned date (most recent first)
      return filtered.sort((a, b) => new Date(b.returned_at) - new Date(a.returned_at));
    }
  },
  methods: {
    async fetchReturnedItems() {
      try {
        // Fetch returned equipment requests
        const equipmentRes = await axios.get("/api/requests");
        console.log('All equipment requests:', equipmentRes.data);
        
        const returnedEquipment = equipmentRes.data
          .filter(item => item.returned === true || item.returned === 1 || item.returned === "1")
          .map(item => ({
            id: item.id,
            name: item.name,
            idnum: item.borrower_id,
            year: item.year,
            dept: item.department,
            course: item.course,
            date: item.date,
            time_in: item.time_in,
            time_out: item.time_out,
            itemName: item.item?.name || 'N/A',
            source: 'item',
            returned_at: item.updated_at
          }));

        console.log('Filtered returned equipment:', returnedEquipment);

        // Fetch returned room requests
        const roomRes = await axios.get("/api/room-requests");
        console.log('All room requests:', roomRes.data);
        
        const returnedRooms = roomRes.data
          .filter(item => item.returned === true || item.returned === 1 || item.returned === "1")
          .map(item => ({
            id: item.id,
            name: item.name,
            idnum: item.borrower_id,
            year: item.year,
            dept: item.department,
            course: item.course,
            date: item.date,
            time_in: item.time_in,
            time_out: item.time_out,
            itemName: item.room?.name || 'N/A',
            source: 'room',
            returned_at: item.updated_at
          }));

        console.log('Filtered returned rooms:', returnedRooms);

        this.returnedItems = [...returnedEquipment, ...returnedRooms];
        console.log('Final returned items:', this.returnedItems);
      } catch (error) {
        console.error('Error fetching returned items:', error);
        this.showCustomAlert('error', 'Error!', 'Failed to fetch returned items.');
      }
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString();
    },
    formatTime(time) {
      if (!time) return 'N/A';
      const [hours, minutes] = time.split(':');
      const h = parseInt(hours, 10);
      const suffix = h >= 12 ? 'PM' : 'AM';
      const formattedHour = ((h + 11) % 12 + 1);
      return `${formattedHour}:${minutes} ${suffix}`;
    },
    deleteReturnedItem(item) {
      this.itemToDelete = item;
      this.confirmItemType = item.source === 'room' ? 'room request' : 'equipment request';
      this.showConfirmDialog = true;
    },
    async confirmDelete() {
      if (!this.itemToDelete) return;
      
      try {
        // Determine the correct API endpoint based on the item source
        const endpoint = this.itemToDelete.source === 'room' 
          ? `/api/room-requests/${this.itemToDelete.id}`
          : `/api/requests/${this.itemToDelete.id}`;
        
        await axios.delete(endpoint);
        
        // Remove the item from the local array
        this.returnedItems = this.returnedItems.filter(returnedItem => 
          !(returnedItem.id === this.itemToDelete.id && returnedItem.source === this.itemToDelete.source)
        );
        
        this.showCustomAlert('success', 'Success!', 'Item deleted successfully!');
        this.closeConfirmDialog();
      } catch (error) {
        console.error('Error deleting item:', error);
        this.showCustomAlert('error', 'Error!', 'Failed to delete item. Please try again.');
        this.closeConfirmDialog();
      }
    },
    closeConfirmDialog() {
      this.showConfirmDialog = false;
      this.itemToDelete = null;
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
    }
  },
  mounted() {
    // Get user email from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.email) {
      this.userEmail = user.email;
    }
    this.fetchReturnedItems();
  }
};
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Roboto', sans-serif;
}

.container {
  display: flex;
  flex-direction: row;
  min-height: 100vh;
  min-width: 100vw;
  height: 100vh; /* full viewport height */
  overflow: hidden; /* confine scrolling to main */
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
  display: flex;
  align-items: center;
  gap: 10px;
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

.content {
  margin-top: 30px;
}

.history-header {
  margin-bottom: 30px;
}

.history-header h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 28px;
}

.filter-controls {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-controls label {
  font-weight: bold;
  color: #2c3e50;
}

.filter-controls select,
.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.search-input {
  min-width: 250px;
}

.refresh-btn {
  background: #007e3a;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s;
}

.refresh-btn:hover {
  background: #005a2a;
}

.history-content {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.no-items {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
  font-size: 16px;
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

table th {
  background-color: #f8f9fa;
  font-weight: bold;
  color: #2c3e50;
}

table tr:hover {
  background-color: #f8f9fa;
}

.item-type {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.item-type.room {
  background: #007bff;
  color: white;
}

.item-type.item {
  background: #43a047;
  color: white;
}

.returned-date {
  color: #28a745 !important;
  font-weight: bold;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}

.delete-btn:hover {
  background-color: #c82333;
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
  
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    min-width: auto;
  }
  
  table {
    font-size: 12px;
  }
  
  table th, table td {
    padding: 6px 4px;
  }
}

/* Custom Alert System */
.custom-alert {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  max-width: 400px;
  min-width: 300px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideInRight 0.3s ease-out;
}

.custom-alert.success {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  border-left: 4px solid #28a745;
}

.custom-alert.error {
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
  border-left: 4px solid #dc3545;
}

.custom-alert.warning {
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  border-left: 4px solid #ffc107;
}

.custom-alert.info {
  background: linear-gradient(135deg, #d1ecf1, #bee5eb);
  border-left: 4px solid #17a2b8;
}

.alert-content {
  display: flex;
    align-items: flex-start;
  padding: 16px;
  gap: 12px;
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
  color: #2c3e50;
}

.alert-message p {
  margin: 0;
  font-size: 14px;
  color: #495057;
  line-height: 1.4;
}

.alert-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.alert-close:hover {
  background-color: rgba(0, 0, 0, 0.1);
  color: #495057;
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
