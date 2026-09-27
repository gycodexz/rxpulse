import CrudPage from '../components/CrudPage'

const TYPES = ['hospital', 'clinic', 'phc', 'dispensary']

export default function Institutions() {
  const fields = [
    { name: 'name', label: 'Institution name', required: true, placeholder: 'KEM Hospital' },
    { name: 'type', label: 'Type', type: 'select', required: true, options: TYPES.map((t) => ({ value: t, label: t.toUpperCase() })) },
    { name: 'contact_person', label: 'Contact person', placeholder: 'Dr. Mehta' },
    { name: 'contact_phone', label: 'Contact phone', placeholder: '9876543210' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'kem@hospital.com' },
    { name: 'address.street', label: 'Street', placeholder: 'Acharya Donde Marg' },
    { name: 'address.city', label: 'City', placeholder: 'Mumbai' },
    { name: 'address.state', label: 'State', placeholder: 'Maharashtra' },
    { name: 'address.pincode', label: 'Pincode', placeholder: '400012' },
  ]

  const columns = [
    { key: 'name', label: 'Institution' },
    { key: 'type', label: 'Type', render: (i) => <span className="capitalize">{i.type}</span> },
    { key: 'contact_person', label: 'Contact' },
    { key: 'city', label: 'City', render: (i) => i.address?.city || '—' },
  ]

  const buildPayload = (form) => ({
    name: form.name,
    type: form.type,
    contact_person: form.contact_person,
    contact_phone: form.contact_phone,
    email: form.email,
    address: {
      street: form['address.street'],
      city: form['address.city'],
      state: form['address.state'],
      pincode: form['address.pincode'],
    },
  })

  return (
    <CrudPage
      title="Institutions"
      subtitle="Hospitals, clinics and PHCs receiving drugs"
      endpoint="/api/institutions"
      fields={fields}
      columns={columns}
      buildPayload={buildPayload}
    />
  )
}
