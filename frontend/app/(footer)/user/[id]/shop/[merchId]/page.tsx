"use client";
import { Breadcrumbs } from "@/components/elements/Breadcrumbs";
import { DropdownList } from "@/components/shop/DropdownList";
import Image from "next/image";

export default function ShopItem({ params }: any) {
  const merchId: String = params.merchId;
  const merch = {
    id: 1,
    name: "2025 SPORTSHUB HOODIE",
    href: "/shop/1",
    imageSrc:
      "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/shop%2Fc5vFAZ3NlSXVuHGrwlkCjJr3RXX2%2FMHQr4VH2okw0muIsgKYb.jpg?alt=media&token=993066e7-49d7-4585-8dd9-139b0c94eb50",
    imageAlt: "Front of men's Basic Tee in black.",
    price: "$80",
    color: "Black",
  };

  return (
    <div className="my-20">
      <div className="mx-auto screen-width-primary">
        <Breadcrumbs texts={["Shop", merch.name]} links={["/user/1/shop", ""]} />
        <div className="grid md:grid-cols-2 md:space-x-4 mt-2">
          <div className="w-full flex justify-center mb-6">
            <Image src={merch.imageSrc} alt={""} width={0} height={0} className="w-auto rounded-xl max-h-[32rem]" />
          </div>
          <div>
            <div className="font-semibold text-3xl">{merch.name}</div>
            <div className="font-thin text-2xl my-4">{merch.price}</div>
            <p className="text-sm my-4 font-light mt-8 mb-4">
              The Zip Tote Basket is the perfect midpoint between shopping tote and comfy backpack. With convertible
              straps, you can hand carry, should sling, or backpack this convenient and spacious bag. The zip top and
              durable canvas construction keeps your goods protected for all-day use.
            </p>
            <div className="mb-8">
              <h4 className="text-sm font-light mb-2">Colour</h4>
              <div className="flex space-x-2">
                <div className=" bg-white rounded-full h-6 w-6 border border-black flex justify-center items-center">
                  <div className=" bg-black rounded-full h-5 w-5"></div>
                </div>
                <div className=" bg-white rounded-full h-6 w-6 border border-blue-400 flex justify-center items-center">
                  <div className=" bg-blue-400 rounded-full h-5 w-5"></div>
                </div>
                <div className=" bg-white rounded-full h-6 w-6 border border-yellow-600 flex justify-center items-center">
                  <div className=" bg-yellow-600 rounded-full h-5 w-5"></div>
                </div>
              </div>
            </div>
            {/* // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore */}
            <stripe-buy-button
              buy-button-id="buy_btn_1RPg0Z02HimhB87JytQ3vT3B"
              publishable-key="pk_live_51PkQOJ02HimhB87J8tgFj3JqPOfQL6ma9YR6VDaeqjC9S9P6ky1mQLJuFbZK19SQ9qdsLK1l86hUkQgXm26cSXRg000JpGqsXi"
            />
            <div className="h-[1px] w-full bg-black mt-8 "></div>
            <DropdownList
              title="Features"
              list={[
                "• Double-Lined Hood – for added warmth and structure.",
                "• Kangaroo Pocket – a large front pocket for warmth or storage.",
                "• Ribbed Cuffs and Hem – for a snug, comfortable fit.",
                "• Soft Fleece Interior – adds warmth and comfort.",
              ]}
            />
            <DropdownList
              title="Shipping"
              list={[
                "• We unfortunately only ship to Australia.",
                "• It is a flat $15 shipping fee to cover Australia Post.",
                "• It may take up to 3 months to arrive as we do not keep stock.",
              ]}
            />
            <DropdownList
              title="Returns"
              list={[
                "• We do not offer returns for change of mind.",
                "• If there is a quality issue, please reach out via contact us.",
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
