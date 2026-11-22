"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** /products/new opens the add-product dialog on the products list. */
export default function NewProductPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/products?action=add");
  }, [router]);
  return null;
}
