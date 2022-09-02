/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, {
  FC,
  useState,
  useContext,
  useEffect,
  SyntheticEvent,
} from "react";
// import PropTypes from 'prop-types'
import { useMutation, useLazyQuery } from "react-apollo";
import { defineMessages, useIntl } from "react-intl";
import { ProductContext } from "vtex.product-context";
import { ToastContext, Button } from "vtex.styleguide";
import OutlinedButton from "./components/OutlinedButton";
import { useRuntime, NoSSR } from "vtex.render-runtime";
import { useCssHandles } from "vtex.css-handles";
import { Helmet } from 'vtex.render-runtime'
import { usePixel } from "vtex.pixel-manager";

import { getSession } from "./modules/session";
import storageFactory from "./utils/storage";
import checkItem from "./queries/checkItem.gql";
import addToList from "./queries/addToList.gql";
import removeFromList from "./queries/removeFromList.gql";
import styles from "./styles.css";

const localStore: any = storageFactory(() => sessionStorage);
const CSS_HANDLES = ["wishlistIconContainer", "wishlistIcon"];

type ButtonType = "ICON" | "ICON_WITH_TEXT";

type AddBtnProps = {
  toastURL?: string,
  buttonType: ButtonType,
};

let isAuthenticated =
  JSON.parse(String(localStore.getItem("wishlist_isAuthenticated"))) ?? false;
let shopperId = localStore.getItem("wishlist_shopperId") ?? null;
let addAfterLogin = localStore.getItem("wishlist_addAfterLogin") ?? null;
let wishListed: any =
  JSON.parse(localStore.getItem("wishlist_wishlisted")) ?? [];

const productCheck: {
  [key: string]: { isWishlisted: boolean, wishListId: string, sku: string },
} = {};
const defaultValues = {
  LIST_NAME: "Wishlist",
};

const messages: {
  [key: string]: { defaultMessage: string, id: string },
} = defineMessages({
  addButton: {
    defaultMessage: "",
    id: "store/wishlist.addButton",
  },
  seeLists: {
    defaultMessage: "",
    id: "store/wishlist-see-lists",
  },
  productAddedToList: {
    defaultMessage: "",
    id: "store/wishlist-product-added-to-list",
  },
  productRemovedFromList: {
    defaultMessage: "",
    id: "store/wishlist-product-removed-from-list",
  },
  addProductFail: {
    defaultMessage: "",
    id: "store/wishlist-add-product-fail",
  },
  listNameDefault: {
    defaultMessage: "",
    id: "store/wishlist-default-list-name",
  },
  login: {
    defaultMessage: "",
    id: "store/wishlist-login",
  },
  notLogged: {
    defaultMessage: "",
    id: "store/wishlist-not-logged",
  },
});

const useSessionResponse = () => {
  const [session, setSession] = useState();
  const sessionPromise = getSession();

  useEffect(() => {
    if (!sessionPromise) {
      return;
    }

    sessionPromise.then((sessionResponse) => {
      const { response } = sessionResponse;

      setSession(response);
    });
  }, [sessionPromise]);

  return session;
};

const addWishlisted = (productId: any, sku: any) => {
  if (
    wishListed.find(
      (item: any) =>
        item.productId &&
        item.sku &&
        item.productId === productId &&
        item.sku === sku
    ) === undefined
  ) {
    wishListed.push({
      productId,
      sku,
    });
  }
  saveToLocalStorageItem(wishListed);
};

const saveToLocalStorageItem = (data: any): any => {
  localStore.setItem("wishlist_wishlisted", JSON.stringify(data));
  return data;
};

const AddBtn: FC<AddBtnProps> = ({
  toastURL = "/account/#wishlist",
  buttonType = "ICON",
}) => {
  const intl = useIntl();
  const [state, setState] = useState<any>({
    isLoading: true,
    isWishlistPage: null,
  });

  const [removeProduct, { loading: removeLoading }] = useMutation(
    removeFromList,
    {
      onCompleted: () => {
        const [productId] = String(product.productId).split("-");
        if (productCheck[productId]) {
          productCheck[productId] = {
            isWishlisted: false,
            wishListId: "",
            sku: "",
          };
        }

        wishListed = wishListed.filter(
          (item: any) => !(item.productId === productId && item.sku === sku)
        );
        saveToLocalStorageItem(wishListed);

        setState({
          ...state,
          isWishlistPage: false,
        });

        toastMessage("productRemovedFromList", toastURL);
      },
    }
  );
  const { navigate, history, route, account } = useRuntime();
  const { push } = usePixel();
  const handles = useCssHandles(CSS_HANDLES);
  const { showToast } = useContext(ToastContext);
  const { selectedItem, product } = useContext(ProductContext) as any;
  const sessionResponse: any = useSessionResponse();
  const [handleCheck, { data, loading, called }] = useLazyQuery(checkItem);

  const [productId] = String(product?.productId).split("-");
  const sku = product?.sku?.itemId;
  wishListed = JSON.parse(localStore.getItem("wishlist_wishlisted")) ?? [];

  const toastMessage = (messsageKey: string, linkWishlist: string) => {
    let action: any;

    if (messsageKey === "notLogged") {
      action = {
        label: intl.formatMessage(messages.login),
        onClick: () =>
          navigate({
            page: "store.login",
            query: `returnUrl=${encodeURIComponent(
              history?.location?.pathname
            )}`,
          }),
      };
    }

    if (messsageKey === "productAddedToList" || "productRemovedFromList") {
      action = {
        label: intl.formatMessage(messages.seeLists),
        onClick: () =>
          navigate({
            to: linkWishlist,
            fetchPage: true,
          }),
      };
    }

    showToast({
      message: intl.formatMessage(messages[messsageKey]),
      action
    });
  };

  const [addProduct, { loading: addLoading, error: addError }] = useMutation(
    addToList,
    {
      onCompleted: (res: any) => {
        productCheck[productId] = {
          wishListId: res.addToList,
          isWishlisted: true,
          sku,
        };
        addWishlisted(productId, sku);
        toastMessage("productAddedToList", toastURL);
      },
    }
  );

  if (addError) {
    toastMessage("addProductFail", toastURL);
  }

  if (sessionResponse) {
    isAuthenticated =
      sessionResponse?.namespaces?.profile?.isAuthenticated?.value === "true";
    shopperId = sessionResponse?.namespaces?.profile?.email?.value ?? null;

    localStore.setItem(
      "wishlist_isAuthenticated",
      JSON.stringify(isAuthenticated)
    );
    localStore.setItem("wishlist_shopperId", String(shopperId));
    if (!isAuthenticated && !shopperId) {
      if (localStore.getItem("wishlist_wishlisted")) {
        localStore.removeItem("wishlist_wishlisted");
      }
    }
  }

  const { isWishlistPage } = state;

  if (!product) return null;

  if (isWishlistPage === null && product?.wishlistPage) {
    setState({
      ...state,
      isWishlistPage: true,
    });
  }

  const getIdFromList = (list: string, item: any) => {
    const pos = item.listNames.findIndex((listName: string) => {
      return list === listName;
    });
    return item.listIds[pos];
  };

  if (isAuthenticated && product && !called) {
    if (isAuthenticated && addAfterLogin && addAfterLogin === productId) {
      addProduct({
        variables: {
          listItem: {
            productId,
            title: product.productName,
          },
          shopperId,
          name: defaultValues.LIST_NAME,
        },
      });
      addAfterLogin = null;
      localStore.removeItem("wishlist_addAfterLogin");
    } else {
      handleCheck({
        variables: {
          shopperId: String(shopperId),
          productId,
          sku,
        },
      });
    }
  }

  const checkFill = () => {
    return sessionResponse?.namespaces?.profile?.isAuthenticated?.value ===
      "false"
      ? false
      : wishListed.find(
          (item: any) => item.productId === productId && item.sku === sku
        ) !== undefined;
  };

  const handleAddProductClick = (e: SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated) {
      const pixelEvent: any = {
        list: route?.canonicalPath?.replace("/", ""),
        items: {
          product,
          selectedItem,
          account,
        },
      };

      if (checkFill()) {
        removeProduct({
          variables: {
            id: productCheck[productId].wishListId,
            shopperId,
            name: defaultValues.LIST_NAME,
          },
        });
        pixelEvent.event = "removeToWishlist";
      } else {
        addProduct({
          variables: {
            listItem: {
              productId,
              title: product.productName,
              sku: selectedItem.itemId,
            },
            shopperId,
            name: defaultValues.LIST_NAME,
          },
        });
        pixelEvent.event = "addToWishlist";
      }

      push(pixelEvent);
    } else {
      localStore.setItem("wishlist_addAfterLogin", String(productId));
      toastMessage("notLogged", toastURL);
    }
  };

  if (
    data?.checkList?.inList &&
    (!productCheck[productId] || productCheck[productId].wishListId === null)
  ) {
    const itemWishListId = getIdFromList(
      defaultValues.LIST_NAME,
      data.checkList
    );

    productCheck[productId] = {
      isWishlisted: data.checkList.inList,
      wishListId: itemWishListId,
      sku,
    };

    if (
      data.checkList.inList &&
      wishListed.find(
        (item: any) => item.productId === productId && item.sku === sku
      ) === undefined
    ) {
      addWishlisted(productId, sku);
    }
  }

  const successfulCartIcon = `
    .vtex-toast {
      background-repeat: no-repeat;
      background-position: 9px center;
      background-image: url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M15 2.66666C8.19563 2.66666 2.67143 8.18397 2.67143 15C2.67143 21.816 8.19563 27.3333 15 27.3333C21.8043 27.3333 27.3285 21.816 27.3285 15C27.3285 8.18397 21.8043 2.66666 15 2.66666ZM0.661865 15C0.661865 7.08841 7.07674 0.666656 15 0.666656C22.9232 0.666656 29.3381 7.08841 29.3381 15C29.3381 22.9116 22.9232 29.3333 15 29.3333C7.07674 29.3333 0.661865 22.9116 0.661865 15ZM22.3754 8.95786C22.7688 9.34746 22.7703 9.98062 22.3788 10.3721L13.0455 19.7054C12.8569 19.894 12.6006 20 12.3333 20C12.066 20 11.8097 19.894 11.6211 19.7054L7.62113 15.7054C7.22968 15.314 7.2312 14.6808 7.62452 14.2912C8.01785 13.9016 8.65404 13.9031 9.0455 14.2946L12.3333 17.5824L20.9545 8.96124C21.3459 8.56978 21.9821 8.56827 22.3754 8.95786Z' fill='%23FCFCFC'/%3E%3C/svg%3E%0A");
    }
    .lh-copy {
      margin-left: 18px
    }
    `

  return (
    <NoSSR>
      <Helmet key={`helmet-wishlist-icon`}>
        <style id="helmetWishlistIcon">{successfulCartIcon}</style>
      </Helmet>
      {buttonType === "ICON" ? (
        // STANDARD VTEX HEART ICON BUTTON
        <div className={handles.wishlistIconContainer}>
          <Button
            variation="tertiary"
            onClick={handleAddProductClick}
            isLoading={loading || addLoading || removeLoading}
          >
            <span
              className={`${handles.wishlistIcon} ${
                checkFill() ? styles.fill : styles.outline
              } ${styles.iconSize}`}
            />
          </Button>
        </div>
      ) : (
        // TFG WISHLIST BUTTON
        <div className={handles.wishlistIconContainer}>
          <OutlinedButton
            block
            onClick={handleAddProductClick}
            loading={loading || addLoading || removeLoading}
          >
            {checkFill() ? "Removed from wishlist" : "Added To wishlist"}
          </OutlinedButton>
        </div>
      )}
    </NoSSR>
  );
};

// AddBtn.propTypes = {
//   toastURL: PropTypes.string.isRequired,
// }

export default AddBtn;
