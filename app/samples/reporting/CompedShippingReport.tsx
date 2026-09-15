'use client';

import Button from "@/lib/ui/Button";
import Checkbox from "@/lib/ui/Checkbox";
import InputText from "@/lib/ui/InputText";
import InputToggle from "@/lib/ui/InputToggle";
import ListContainer from "@/lib/ui/ListContainer";
import MasterList from "@/lib/ui/MasterList";
import PageStandard from "@/lib/ui/PageStandard";
import TopBarContainer from "@/lib/ui/TopBarContainer";
import ziaBackendCall from "@/lib/ziaBackendCall";
import { useRef, useState } from "react";

export default function CompedShippingReport(props: {tag: string}) {
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
            const response = await ziaBackendCall(`ops/compedShippingReport?tag=${props.tag}&startDate=${today}&endDate=${today}&format=json&status=any`, 'GET', undefined)
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
            const response = await ziaBackendCall(`ops/compedShippingReport?tag=${props.tag}&startDate=${startDate}&endDate=${today}&format=json&status=any`, 'GET', undefined)
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
            const response = await ziaBackendCall(`ops/compedShippingReport?tag=${props.tag}&startDate=${startDate}&endDate=${today}&format=json&status=any`, 'GET', undefined)
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
                    const response = await ziaBackendCall(`ops/compedShippingReport?tag=${props.tag}&startDate=${startDate}&endDate=${endDate}&format=json&status=any`, 'GET', undefined)
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
          list={[
            ...[{isDivider: true, name: 'By Operation', department: 'Qty', labelCost: 'Total'}],
            ...(Object.keys(data.summary?.byTag || {}).filter((tag: string) => !(['Sample Order', 'Standard Sample Delivery', 'Expedited Sample Delivery', 'Standard Sample Order', 'UPS 2nd Day Air', 'UPS Next Day Air', 'PRIORITY-SAMPLE-ORDER'].includes(tag))).map((tag: string) => ({
              name: tag,
              department: `${data.summary?.byTag[tag]?.orders || 0}`,
              labelCost: `$${data.summary?.byTag[tag]?.compedShippingCost || 0}`,
            })) || []),
            ...[{isDivider: true, name: 'By Day', department: 'Qty', labelCost: 'Total'}],
            ...(Object.keys(data.summary?.byDay || {}).map((day: string) => ({
              name: day,
              department: `${data.summary?.byDay[day]?.orders || 0}`,
              labelCost: `$${data.summary?.byDay[day]?.compedShippingCost || 0}`,
            })) || []),
            ...[{isDivider: true, name: 'By Order', department: 'Department', labelCost: 'Label Cost'}],
            ...(data.orders.filter((order:any)=>order.labelCost > 0).map((order: any) => ({
              name: order.orderName,
              department: order.tags.split(',').filter((tag: string) => tag.toLowerCase()?.includes('trade'))?.length > 0 ? 'Trade' : '',
              labelCost: `$${order.labelCost}`,
            })) || []),
            ...[{
              name: 'Total',
              department: `${data.summary?.shippedOrderCount}`,
              labelCost: `$${data.summary?.shippedCompedCost}`,
            }], 
          ]}
          actionFunction={() => {}}
          actionFunctions={[]}
          hideHeader={true}
          killMt={true}
          headers={[{ name: 'Order #'}, { name: 'Department'}, { name: 'Shipping Cost' },]}
          keys={['name', 'department', 'labelCost']}
        />}
      </ListContainer>
    </PageStandard>
  );
}