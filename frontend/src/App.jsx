import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth, ROLE_CONFIGS } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

// Auth Pages
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'

// Master Data Pages
import Vendors from './pages/Vendors'
import Institutions from './pages/Institutions'
import Users from './pages/Users'

// Role Pages: Administrator
import AdminDashboard from './pages/admin/AdminDashboard'
import ShortagesManagement from './pages/admin/ShortagesManagement'
import OrderApprovals from './pages/admin/OrderApprovals'

// Role Pages: Pharmacist
import PharmacistDashboard from './pages/pharmacist/PharmacistDashboard'
import DrugMasterCatalog from './pages/pharmacist/DrugMasterCatalog'
import StockLedger from './pages/pharmacist/StockLedger'
import ExpiryQuarantine from './pages/pharmacist/ExpiryQuarantine'
import DistributionManager from './pages/pharmacist/DistributionManager'
import PharmacistOrders from './pages/pharmacist/PharmacistOrders'

// Role Pages: Vendor
import VendorDashboard from './pages/vendor/VendorDashboard'
import SupplyCart from './pages/vendor/SupplyCart'
import VendorOrders from './pages/vendor/VendorOrders'
import VendorProducts from './pages/vendor/VendorProducts'

// Role Pages: Institution Staff
import StaffDashboard from './pages/staff/StaffDashboard'
import RequisitionCart from './pages/staff/RequisitionCart'
import InboundDeliveries from './pages/staff/InboundDeliveries'
import WardDispense from './pages/staff/WardDispense'

function RoleRedirect() {
  const { user } = useAuth()
  const role = user?.role || 'admin'
  const target = ROLE_CONFIGS[role]?.dashboardPath || '/admin/dashboard'
  return <Navigate to={target} replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Automatic Role Dashboard Redirection */}
            <Route path="/dashboard" element={<RoleRedirect />} />

            {/* Administrator Routes */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/shortages" element={<ShortagesManagement />} />
            <Route path="/admin/approvals" element={<OrderApprovals />} />

            {/* Pharmacist / Warehouse Routes */}
            <Route path="/pharmacist/dashboard" element={<PharmacistDashboard />} />
            <Route path="/pharmacist/drugs" element={<DrugMasterCatalog />} />
            <Route path="/pharmacist/inventory" element={<StockLedger />} />
            <Route path="/pharmacist/expiry-quarantine" element={<ExpiryQuarantine />} />
            <Route path="/pharmacist/distributions" element={<DistributionManager />} />
            <Route path="/pharmacist/orders" element={<PharmacistOrders />} />

            {/* Vendor / Supplier Routes */}
            <Route path="/vendor/dashboard" element={<VendorDashboard />} />
            <Route path="/vendor/supply-cart" element={<SupplyCart />} />
            <Route path="/vendor/orders" element={<VendorOrders />} />
            <Route path="/vendor/products" element={<VendorProducts />} />

            {/* Institution / Hospital Staff Routes */}
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/requisition" element={<RequisitionCart />} />
            <Route path="/staff/deliveries" element={<InboundDeliveries />} />
            <Route path="/staff/dispense" element={<WardDispense />} />

            {/* Shared Master Data & Directory */}
            <Route path="/institutions" element={<Institutions />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/users" element={<Users />} />

            {/* Backward Compatibility Aliases */}
            <Route path="/drugs" element={<Navigate to="/pharmacist/drugs" replace />} />
            <Route path="/inventory" element={<Navigate to="/pharmacist/inventory" replace />} />
            <Route path="/distributions" element={<Navigate to="/pharmacist/distributions" replace />} />
            <Route path="/purchase-orders" element={<Navigate to="/pharmacist/orders" replace />} />
          </Route>

          <Route path="/" element={<RoleRedirect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}
