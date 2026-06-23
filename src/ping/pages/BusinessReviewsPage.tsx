import { useBusinessContext } from '@/app/useBusinessContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { Icon } from '@/components/common/Icon'
import { BusinessReviews } from '@/components/businesses/BusinessReviews'
import { BusinessSwitcher } from '@/components/businesses/BusinessSwitcher'

export function BusinessReviewsPage() {
  const { current } = useBusinessContext()

  if (!current) {
    return (
      <div>
        <PageHeader eyebrow="Business" title="Reviews" />
        <EmptyState icon={<Icon name="star" size={44} />} title="No business selected">
          Switch to a business-owner profile to see your reviews.
        </EmptyState>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Business"
        title="Reviews"
        description={`What verified customers say about ${current.name}.`}
        actions={<BusinessSwitcher />}
      />
      <Card pad="lg">
        <BusinessReviews business={current} />
      </Card>
    </div>
  )
}
