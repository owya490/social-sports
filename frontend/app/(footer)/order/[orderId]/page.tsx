import Loading from "@/components/loading/Loading";
import dynamic from "next/dynamic";

const PurchaserOrderPage = dynamic(() => import("@/components/order/PurchaserOrderPage"), {
  ssr: false,
  loading: () => <Loading />,
});

export default function OrderByIdPage() {
  return <PurchaserOrderPage />;
}
