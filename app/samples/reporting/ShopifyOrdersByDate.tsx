'use client';

import Button from "@/lib/ui/Button";
import Checkbox from "@/lib/ui/Checkbox";
import InputText from "@/lib/ui/InputText";
import InputToggle from "@/lib/ui/InputToggle";
import ListContainer from "@/lib/ui/ListContainer";
import MasterList from "@/lib/ui/MasterList";
import PageStandard from "@/lib/ui/PageStandard";
import TopBarContainer from "@/lib/ui/TopBarContainer";
import authenticatedZiaBackendCall from "@/lib/authenticatedZiaBackendCall";
import { useRef, useState } from "react";

export default function ShopifyOrdersByDate(props: {tag: string}) {
    const [loading, setLoading] = useState<boolean>(false)
    const [data, setData] = useState<any>(null)

    const getToday = () => {
        setLoading(true)
        setTimeout(async () => {
          const t = new Date();

          const year = t.getFullYear();
          // getMonth() is 0-indexed, so add 1
          const month = String(t.getMonth() + 1).padStart(2, '0');
          const day = String(t.getDate()).padStart(2, '0');

          const today = `${year}-${month}-${day}`
            const response = await authenticatedZiaBackendCall(`ops/shopifyOrdersByTagByDateByStatus?tag=${props.tag}&startDate=${today}&endDate=${today}&format=json&status=any`, 'GET', undefined)
            setData(response?.data);
            setLoading(false)
        }, 1)
    }

    const getWtd = () => {
        setLoading(true)
        setTimeout(async () => {
            const today = new Date().toISOString().split('T')[0];
            const startOfWeek = new Date();
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            const startDate = startOfWeek.toISOString().split('T')[0];
            const response = await authenticatedZiaBackendCall(`ops/shopifyOrdersByTagByDateByStatus?tag=${props.tag}&startDate=${startDate}&endDate=${today}&format=json&status=any`, 'GET', undefined)
            setData(response?.data);
            setLoading(false)
        }, 1)
    }

    const get30Days = () => {
        setLoading(true)
        setTimeout(async () => {
            const today = new Date().toISOString().split('T')[0];
            const startOf30Days = new Date();
            startOf30Days.setDate(startOf30Days.getDate() - 30);
            const startDate = startOf30Days.toISOString().split('T')[0];
            const response = await authenticatedZiaBackendCall(`ops/shopifyOrdersByTagByDateByStatus?tag=${props.tag}&startDate=${startDate}&endDate=${today}&format=json&status=any`, 'GET', undefined)
            setData(response?.data);
            setLoading(false)
        }, 1)
    }

    const getRange = () => {
            const startDate = startDateRef.current?.value;
            const endDate = endDateRef.current?.value;
            if (startDate && endDate) {
                setLoading(true)
                setTimeout(async () => {
                    const response = await authenticatedZiaBackendCall(`ops/shopifyOrdersByTagByDateByStatus?tag=${props.tag}&startDate=${startDate}&endDate=${endDate}&format=json&status=any`, 'GET', undefined)
                    setData(response?.data);
                    setLoading(false)
                }, 1)
            }
          }



    const [alert, setAlert] = useState<{type: string, text: string} | undefined>(undefined)

    const startDateRef = useRef<HTMLInputElement>(null)
    const endDateRef = useRef<HTMLInputElement>(null)
  
  return (
    <PageStandard>
      <TopBarContainer>
      <div className="flex justify-between w-full">
        <div className="flex gap-5 items-center">
          <Button size="md" loading={loading} clickAction={getToday}>
            Today
          </Button>
          <Button size="md" loading={loading} clickAction={getWtd}>
            WTD
          </Button>
          <Button size="md" loading={loading} clickAction={get30Days}>
            30 Days
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <InputText type="date" refX={startDateRef}></InputText>
          <span>-</span>
          <InputText type="date" refX={endDateRef}></InputText>
          <Button size="sm" loading={loading} clickAction={getRange}>
            Date Range
          </Button>
        </div>
      </div>
      </TopBarContainer>
      <ListContainer>
        {data && <MasterList
          shadedRows={true}
          hideHeader={true}
          list={[
            { name: 'Order Count', value: data?.summary?.orderCount },
            { name: 'Item Count', value: data?.summary?.itemCount },
            { name: 'Total Sales', value: `$${data?.summary?.subtotalBeforeDiscounts}` },
            { name: 'Total Discounts', value: `$${data?.summary?.discounts}` },
            { name: 'Net Sales', value: `$${data?.summary?.subtotal}` },
            { name: 'Taxes/Duties Collected', value: `$${((Number(data?.summary?.taxes) || 0) + (Number(data?.summary?.duties) || 0))}` },
            { name: 'Shipping Collected', value: `$${data?.summary?.shipping}` },
            { name: 'Refunds', value: `$${data?.summary?.refunded}` },
            { name: 'Total', value: `$${data?.summary?.netTotal}` }
          ]}
          alignFinalRight={true}
          actionFunction={() => {}}
          actionFunctions={[]}
          headers={[{ name: 'Order Summary'}, { name: '' }]}
          keys={['name', 'value']}
        />}
      </ListContainer>
    </PageStandard>
  );
}