/* eslint-disable no-console */
import React, { FC } from 'react'

// @ts-expect-error - useTreePath is a private API
import { ExtensionPoint, useRuntime, useTreePath } from 'vtex.render-runtime'

import { ProductListContext } from 'vtex.product-list-context'

import ProductListEventCaller from './components/ProductListEventCaller'

interface ProductSummaryProps {
  children?: any
  showViewEmptyList?: boolean
  backButton?: boolean
  title?: string
}

const ProductSummaryList: FC<ProductSummaryProps> = ({
  children,
 
}) => {

  return (
    
     children

  )
}

const EnhancedProductList: FC<ProductSummaryProps> = props => {
  const { children, showViewEmptyList } = props
  const { ProductListProvider } = ProductListContext
  return (
    <ProductListProvider listName="wishlist">
      <ProductSummaryList showViewEmptyList={showViewEmptyList}>
        {children}
      </ProductSummaryList>
      <ProductListEventCaller />
    </ProductListProvider>
  )
}

export default EnhancedProductList