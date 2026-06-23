import { useNavigate } from 'react-router-dom'
import { useBusinessContext } from '@/app/useBusinessContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { Icon } from '@/components/common/Icon'
import { OfferForm } from '@/components/businesses/OfferForm'
import { BusinessSwitcher } from '@/components/businesses/BusinessSwitcher'
import { createOffer } from '@/services/businessService'

export function CreateOfferPage() {
  const navigate = useNavigate()
  const { current } = useBusinessContext()

  if (!current) {
    return (
      <div>
        <PageHeader eyebrow="Business" title="Create an offer" />
        <EmptyState icon={<Icon name="tagPlus" size={44} />} title="No business selected">
          Switch to a business-owner profile to publish an offer.
        </EmptyState>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Business"
        title="Create an offer"
        description={`Publish a structured offer for ${current.name}.`}
        actions={<BusinessSwitcher />}
      />
      <Card pad="lg">
        <OfferForm
          defaultCategory={current.category}
          submitLabel="Publish offer"
          onSubmit={(draft) => {
            createOffer(current.id, draft)
            navigate('/biz/offers')
          }}
          onCancel={() => navigate('/biz/offers')}
        />
      </Card>
    </div>
  )
}
