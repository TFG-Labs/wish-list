
import React, {
  FC,
  useState,
  useContext,
  useEffect,
  SyntheticEvent,
} from "react";
import { useMutation, useLazyQuery } from "react-apollo";
import { defineMessages, useIntl } from "react-intl";
import { ProductContext } from "vtex.product-context";
import { ToastContext, Button } from "vtex.styleguide";
import OutlinedButton from "./components/OutlinedButton";
import { useRuntime, NoSSR } from "vtex.render-runtime";
import { useCssHandles } from "vtex.css-handles";
import { usePixel } from "vtex.pixel-manager";
import { getSession } from "./modules/session";
import storageFactory from "./utils/storage";
import checkItem from "./queries/checkItem.gql";
import addToList from "./queries/addToList.gql";
import removeFromList from "./queries/removeFromList.gql";
import styles from "./styles.css";
import { showLoginToast, showRemoveToast, showSuccessToast } from "./components/ToastMessage/Toast";
import { useProduct } from "vtex.product-context";
import { pushDatalayer } from "./utils/normalize";

const localStore: any = storageFactory(() => sessionStorage);

const CSS_HANDLES = ["wishlistIconContainer", "wishlistIcon", "skuErrorMessage"];
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

const addWishlisted = (productId: any, sku: any, id:any) => {
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
      id
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
      },
    }
  );
  const { navigate, history, route, account } = useRuntime();
  const { push } = usePixel();
  const {handles} = useCssHandles(CSS_HANDLES);
  const { showToast } = useContext(ToastContext);
  const { selectedItem, product } = useContext(ProductContext) as any;
  const sessionResponse: any = useSessionResponse();
  const [handleCheck, { data, loading, called }] = useLazyQuery(checkItem);
  const {skuSelector} = useProduct()

 const { areAllVariationsSelected } = skuSelector
  
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
    if (messsageKey === "productAddedToList") {
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
      action,
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
        addWishlisted(productId, selectedItem.itemId, res.id);
        showSuccessToast('Added to wishlist');
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
            sku:selectedItem.itemId,
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
          (item: any) => item.productId === productId && item.sku === selectedItem.itemId
        ) !== undefined;
  };

  const handleAddProductClick =  async (e: SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let dataLayerEvent = {}

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

        const wishlistedItems =  JSON.parse(sessionStorage.getItem('wishlist_wishlisted') ?? '[]')
        const removedItems = wishlistedItems.filter((x: { productId: string; })=>x.productId !== productId)
        sessionStorage.setItem('wishlist_wishlisted',JSON.stringify(removedItems) ) 
        showRemoveToast('Removed from wishlist')
        pixelEvent.event = "removeToWishlist";
        dataLayerEvent = {
          title: product.productName,
          eventLabel: "remove_from_wishlist",
          eventAction: `Removed from wishlist: ${productId}`,
          eventDescription: "User removed an item from wishlist",
          eventCategory: "Wishlist_Event",
        };
      } else {
        if(areAllVariationsSelected){
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
          dataLayerEvent = {
            title: product.productName,
            eventLabel: "add_to_wishlist",
            eventAction: `Added to wishlist: ${productId}`,
            eventDescription: "User added an item to wishlist",
            eventCategory: "Wishlist_Event",
          };
        }else{
          const showErrorMessage = document.querySelector('.thefoschini-tfg-sku-selector-0-x-skuErrorMessage--tfg-sku-selector--unselected') as HTMLInputElement
          showErrorMessage.style.display = 'inline-block'
        }
      }

      push(pixelEvent);
      pushDatalayer({
        event: 'gaEvent',
        platform: 'WEB',
        ...dataLayerEvent
      });
    } else {
      localStore.setItem("wishlist_addAfterLogin", String(productId));
      showLoginToast('Log in to save items to wishlist.')
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

      const wishlistId = data?.checkList?.listIds[0]
      addWishlisted(productId, selectedItem.itemId,wishlistId);
    }
  }

  return (
    <NoSSR>
      {buttonType === "ICON" ? (
        // STANDARD VTEX HEART ICON BUTTON
        <div className={handles.wishlistIconContainer}>
          <Button
            variation="tertiary"
            onClick={handleAddProductClick}
            isLoading={addLoading || removeLoading}
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
            {checkFill() ? "REMOVE FROM WISHLIST" : "ADD TO WISHLIST"}
          </OutlinedButton>
        </div>
      )}
    </NoSSR>
  );
};

export default AddBtn;
