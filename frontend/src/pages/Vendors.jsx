import CrudPage from '../components/CrudPage'

export default function Vendors() {
  const fields = [
    { name: 'name', label: 'Vendor / company name', required: true, placeholder: 'Sun Pharma Distributors' },
    { name: 'contact_person', label: 'Contact person', placeholder: 'Amit Shah' },
    { name: 'phone', label: 'Phone', placeholder: '9876543210' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'amit@sunpharma.com' },
    { name: 'drug_license_number', label: 'Drug license number', required: true, placeholder: 'MH-2024-1234' },
    { name: 'gst_number', label: 'GST number', placeholder: '27ABCDE1234F1Z5' },
    { name: 'address.street', label: 'Street', placeholder: 'MIDC Road' },
    { name: 'address.city', label: 'City', placeholder: 'Pune' },
    { name: 'address.state', label: 'State', placeholder: 'Maharashtra' },
    { name: 'address.pincode', label: 'Pincode', placeholder: '411018' },
  ]

  const columns = [
    { key: 'name', label: 'Vendor' },
    { key: 'contact_person', label: 'Contact' },
    { key: 'phone', label: 'Phone' },
    { key: 'drug_license_number', label: 'License #' },
    { key: 'city', label: 'City', render: (v) => v.address?.city || '—' },
  ]

  const buildPayload = (form) => ({
    name: form.name,
    contact_person: form.contact_person,
    phone: form.phone,
    email: form.email,
    drug_license_number: form.drug_license_number,
    gst_number: form.gst_number,
    address: {
      street: form['address.street'],
      city: form['address.city'],
      state: form['address.state'],
      pincode: form['address.pincode'],
    },
  })

  return (
    <CrudPage
      title="Vendors"
      subtitle="Pharma suppliers and distributors"
      endpoint="/api/vendors"
      fields={fields}
      columns={columns}
      buildPayload={buildPayload}
    />
  )
}
