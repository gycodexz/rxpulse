from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# Shared for all
class Address(BaseModel):
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


# Auth / Users
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6) # Length of password -> 6 (for security)
    role: str  # Can be an admin / pharmacist / vendor / institution_staff
    institution_id: Optional[str] = None
    vendor_id: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# Institutions
class InstitutionIn(BaseModel):
    name: str
    type: str
    address: Address
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: bool = True


# Vendors
class VendorIn(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Address
    drug_license_number: str
    gst_number: Optional[str] = None
    is_active: bool = True


# Drugs
class DrugIn(BaseModel):
    name: str
    generic_name: Optional[str] = None
    manufacturer: Optional[str] = None
    drug_form: str
    quantity: int = 0
    unit: str
    price_per_unit: float
    expiry_date: Optional[str] = None
    batch_number: Optional[str] = None
    schedule: Optional[str] = "OTC"
    salt_composition: Optional[str] = None
    storage_condition: Optional[str] = None
    prescription_required: bool = False
    reorder_level: int = 0
    vendor_id: Optional[str] = None


# Purchase Orders
class POItem(BaseModel):
    drug_id: str
    drug_name: str
    quantity_ordered: int
    unit: str
    price_per_unit: float
    total_price: float


class PurchaseOrderIn(BaseModel):
    vendor_id: str
    expected_delivery: Optional[str] = None
    items: List[POItem]
    notes: Optional[str] = None


class PurchaseOrderStatusUpdate(BaseModel):
    status: str  # Can be pending / approved / shipped / delivered / cancelled
    courier_name: Optional[str] = None
    tracking_number: Optional[str] = None
    notes: Optional[str] = None


# Inventory
class InventoryIn(BaseModel):
    drug_id: str
    drug_name: str
    transaction_type: str  # in / out
    quantity: int
    unit: str
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None
    purchase_order_id: Optional[str] = None
    vendor_id: Optional[str] = None
    distribution_id: Optional[str] = None
    institution_id: Optional[str] = None
    notes: Optional[str] = None


# Distributions
class DistItem(BaseModel):
    drug_id: str
    drug_name: str
    batch_number: Optional[str] = None
    quantity: int
    unit: str
    expiry_date: Optional[str] = None


class DistributionIn(BaseModel):
    institution_id: str
    items: List[DistItem]
    notes: Optional[str] = None


class DistributionStatusUpdate(BaseModel):
    status: str  # Can be dispatched / delivered / returned
    acknowledgment_notes: Optional[str] = None


# Requisitions from Hospital Staff
class RequisitionItem(BaseModel):
    drug_id: str
    drug_name: str
    requested_quantity: int
    unit: str


class HospitalRequisitionIn(BaseModel):
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    department: str = "General"
    urgency: str = "normal"  # normal, urgent, emergency
    items: List[RequisitionItem]
    notes: Optional[str] = None


# Vendor Supply Quote / Cart Submission
class VendorSupplyItem(BaseModel):
    drug_id: str
    drug_name: str
    quantity: int
    unit: str
    price_per_unit: float
    total_price: float
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None


class VendorSupplyQuoteIn(BaseModel):
    vendor_id: Optional[str] = None
    vendor_name: Optional[str] = None
    items: List[VendorSupplyItem]
    expected_dispatch_date: Optional[str] = None
    notes: Optional[str] = None


# Ward / Patient Dispensing
class ConsumptionLogIn(BaseModel):
    drug_id: str
    drug_name: str
    ward_name: str
    patient_identifier: Optional[str] = None
    quantity: int
    unit: str
    prescribed_by: Optional[str] = None
    notes: Optional[str] = None

