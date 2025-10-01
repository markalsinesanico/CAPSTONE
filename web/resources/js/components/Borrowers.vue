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
              <button class="qr-btn" @click="generateQRCode(item)">QR CODE</button>
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
              <th>Receipt</th>
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
              <td>{{ borrower.date }}</td>
             <td>{{ formatTime(borrower.time_in) }}</td>
            <td>{{ formatTime(borrower.time_out) }}</td>
              <td>{{ borrower.item?.name || 'N/A' }}</td>
              <td>
                <button class="receipt-btn" @click="generateBorrowerQRCode(borrower)">
                  📄 Receipt
                </button>
              </td>
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

    <!-- QR Code Modal -->
    <div v-if="showQRModal" class="modal" @click.self="closeQRModal">
      <div class="modal-content qr-modal">
        <span class="close" @click="closeQRModal">&times;</span>
        <h3>{{ currentItem ? `${currentItem.name} - QR Codes (${currentItem.qty} units)` : 'QR Code' }}</h3>
        
        <!-- Multiple QR Codes Display -->
        <div v-if="qrCodes.length > 0" class="qr-codes-grid">
          <div v-for="(qr, index) in qrCodes" :key="index" class="qr-unit">
            <h4>Unit {{ qr.unitNumber }} of {{ currentItem.qty }}</h4>
            <img :src="qr.image" alt="QR Code" class="qr-image" />
            <div class="qr-unit-info">
              <p><strong>Unique ID:</strong> {{ qr.data.uniqueId }}</p>
              <p><strong>Item:</strong> {{ qr.data.itemName }}</p>
            </div>
            <div class="qr-unit-actions">
              <button @click="downloadSingleQR(qr)" class="download-btn">📥 Download</button>
              <button @click="printSingleQR(qr)" class="print-btn">🖨️ Print</button>
            </div>
          </div>
        </div>
        
        <!-- Single QR Code Display (for borrower receipts) -->
        <div v-else-if="qrCodeImage" class="qr-container">
          <img :src="qrCodeImage" alt="QR Code" class="qr-image" />
          <div class="qr-info">
            <p><strong>Scan this QR code to view details</strong></p>
            <div class="qr-data">
              <small>{{ qrCodeData }}</small>
            </div>
          </div>
        </div>
        
        <div class="qr-actions">
          <button v-if="qrCodes.length > 0" @click="downloadAllQRCodes" class="download-btn">📥 Download All</button>
          <button v-if="qrCodes.length > 0" @click="printAllQRCodes" class="print-btn">🖨️ Print All</button>
          <button v-else @click="downloadQRCode" class="download-btn">📥 Download QR</button>
          <button v-else @click="printQRCode" class="print-btn">🖨️ Print QR</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import QRCode from "qrcode";

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
      showQRModal: false,
      qrCodeData: "",
      qrCodeImage: "",
      qrCodes: [], // Array to store multiple QR codes
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
        b.name?.toLowerCase().includes(this.search.toLowerCase())
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
          alert("Failed to submit request.");
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
    async cancelRequest(id) {
      if (!confirm("Are you sure you want to cancel this request? This action cannot be undone.")) return;
      try {
        await axios.delete(`/api/requests/${id}`);
        alert("Request cancelled successfully!");
        this.fetchBorrowers();
      } catch (error) {
        console.error("Failed to cancel request:", error);
        alert("Failed to cancel request. Please try again.");
      }
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
    async generateQRCode(item) {
      try {
        // Generate QR codes for each individual unit of the item
        const qrCodes = [];
        
        for (let i = 1; i <= item.qty; i++) {
          const qrData = {
            itemId: item.id,
            itemName: item.name,
            unitNumber: i,
            totalUnits: item.qty,
            uniqueId: `${item.id}-${i}`, // Unique identifier for each unit
            timestamp: new Date().toISOString(),
            type: 'item_borrow'
          };
          
          const qrImage = await QRCode.toDataURL(JSON.stringify(qrData), {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          qrCodes.push({
            data: qrData,
            image: qrImage,
            unitNumber: i
          });
        }
        
        // Show modal with all QR codes
        this.showQRModal = true;
        this.qrCodes = qrCodes;
        this.currentItem = item;
      } catch (error) {
        console.error('Error generating QR codes:', error);
        alert('Failed to generate QR codes');
      }
    },
    async generateBorrowerQRCode(borrower) {
      try {
        // Create QR code data with borrower information
        const qrData = {
          borrowerId: borrower.id,
          borrowerName: borrower.name,
          itemName: borrower.item?.name || 'N/A',
          date: borrower.date,
          timeIn: borrower.time_in,
          timeOut: borrower.time_out,
          timestamp: new Date().toISOString(),
          type: 'borrower_receipt'
        };
        
        this.qrCodeData = JSON.stringify(qrData);
        this.qrCodeImage = await QRCode.toDataURL(this.qrCodeData, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        this.showQRModal = true;
      } catch (error) {
        console.error('Error generating QR code:', error);
        alert('Failed to generate QR code');
      }
    },
    closeQRModal() {
      this.showQRModal = false;
      this.qrCodeData = "";
      this.qrCodeImage = "";
      this.qrCodes = [];
      this.currentItem = null;
    },
    downloadQRCode() {
      if (this.qrCodeImage) {
        const link = document.createElement('a');
        link.download = 'qr-code.png';
        link.href = this.qrCodeImage;
        link.click();
      }
    },
    printQRCode() {
      if (this.qrCodeImage) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
          <html>
            <head>
              <title>QR Code Receipt</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 20px;
                }
                .qr-print { 
                  max-width: 300px; 
                  margin: 0 auto;
                }
                .qr-print img { 
                  width: 100%; 
                  height: auto;
                }
                .qr-info { 
                  margin-top: 20px; 
                  text-align: left;
                }
              </style>
            </head>
            <body>
              <div class="qr-print">
                <h2>QR Code Receipt</h2>
                <img src="${this.qrCodeImage}" alt="QR Code" />
                <div class="qr-info">
                  <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                  <p><strong>Data:</strong> ${this.qrCodeData}</p>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    },
    downloadSingleQR(qr) {
      const link = document.createElement('a');
      link.download = `qr-code-unit-${qr.unitNumber}.png`;
      link.href = qr.image;
      link.click();
    },
    printSingleQR(qr) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - Unit ${qr.unitNumber}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px;
              }
              .qr-print { 
                max-width: 300px; 
                margin: 0 auto;
              }
              .qr-print img { 
                width: 100%; 
                height: auto;
              }
              .qr-info { 
                margin-top: 20px; 
                text-align: left;
              }
            </style>
          </head>
          <body>
            <div class="qr-print">
              <h2>QR Code - Unit ${qr.unitNumber}</h2>
              <img src="${qr.image}" alt="QR Code" />
              <div class="qr-info">
                <p><strong>Item:</strong> ${qr.data.itemName}</p>
                <p><strong>Unit:</strong> ${qr.unitNumber} of ${qr.data.totalUnits}</p>
                <p><strong>Unique ID:</strong> ${qr.data.uniqueId}</p>
                <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    },
    downloadAllQRCodes() {
      this.qrCodes.forEach((qr, index) => {
        setTimeout(() => {
          const link = document.createElement('a');
          link.download = `qr-code-unit-${qr.unitNumber}.png`;
          link.href = qr.image;
          link.click();
        }, index * 500); // Stagger downloads to avoid browser blocking
      });
    },
    printAllQRCodes() {
      const printWindow = window.open('', '_blank');
      let html = `
        <html>
          <head>
            <title>All QR Codes - ${this.currentItem.name}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px;
              }
              .qr-grid { 
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                max-width: 800px;
                margin: 0 auto;
              }
              .qr-item { 
                border: 1px solid #ddd;
                padding: 15px;
                border-radius: 8px;
              }
              .qr-item img { 
                width: 100%; 
                height: auto;
                max-width: 150px;
              }
              .qr-info { 
                margin-top: 10px; 
                text-align: left;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <h2>QR Codes for ${this.currentItem.name} (${this.currentItem.qty} units)</h2>
            <div class="qr-grid">
      `;
      
      this.qrCodes.forEach(qr => {
        html += `
          <div class="qr-item">
            <h4>Unit ${qr.unitNumber}</h4>
            <img src="${qr.image}" alt="QR Code" />
            <div class="qr-info">
              <p><strong>ID:</strong> ${qr.data.uniqueId}</p>
              <p><strong>Item:</strong> ${qr.data.itemName}</p>
            </div>
          </div>
        `;
      });
      
      html += `
            </div>
          </body>
        </html>
      `;
      
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    },
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
    }

    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      background-color: #007e3a;
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

/* QR Code Modal Styles */
.qr-modal {
  max-width: 500px;
  text-align: center;
}

.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
}

.qr-image {
  width: 200px;
  height: 200px;
  border: 2px solid #ddd;
  border-radius: 8px;
  margin-bottom: 15px;
}

.qr-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin: 15px 0;
  text-align: left;
}

.qr-info p {
  margin: 5px 0;
  color: #333;
}

.qr-data {
  background: #e9ecef;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
  word-break: break-all;
  font-family: monospace;
  font-size: 10px;
  color: #666;
}

.qr-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.download-btn, .print-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s ease;
}

.download-btn {
  background-color: #28a745;
  color: white;
}

.download-btn:hover {
  background-color: #218838;
}

.print-btn {
  background-color: #007bff;
  color: white;
}

.print-btn:hover {
  background-color: #0056b3;
}

/* Multiple QR Codes Grid */
.qr-codes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
  max-height: 60vh;
  overflow-y: auto;
}

.qr-unit {
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 15px;
  text-align: center;
  background: #f8f9fa;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.qr-unit:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.qr-unit h4 {
  margin: 0 0 10px 0;
  color: #495057;
  font-size: 16px;
}

.qr-unit .qr-image {
  width: 150px;
  height: 150px;
  border: 2px solid #ddd;
  border-radius: 8px;
  margin: 10px 0;
}

.qr-unit-info {
  background: #e9ecef;
  padding: 10px;
  border-radius: 6px;
  margin: 10px 0;
  text-align: left;
}

.qr-unit-info p {
  margin: 5px 0;
  font-size: 12px;
  color: #495057;
}

.qr-unit-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 10px;
}

.qr-unit-actions .download-btn,
.qr-unit-actions .print-btn {
  padding: 6px 12px;
  font-size: 11px;
  border-radius: 4px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .qr-codes-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .qr-unit {
    padding: 12px;
  }
  
  .qr-unit .qr-image {
    width: 120px;
    height: 120px;
  }
}
</style>
