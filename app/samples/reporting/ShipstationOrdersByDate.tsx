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
import { useEffect, useRef, useState } from "react";

export default function ShipstationOrdersByDate(props: {carrierIds?: string, serviceCodes?: string, serviceProviders?: string, carriers?: any[] }) {
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
            var query = `ops/labelSpendReport?startDate=${today}&endDate=${today}&format=json`
            if(props.carrierIds) {
                query += `&carrierIds=${props.carrierIds}`
            }
            if(props.serviceCodes) {
                query += `&serviceCodes=${props.serviceCodes}`
            }
            if(props.serviceProviders) {
                query += `&serviceProviders=${props.serviceProviders}`
            }
            const response = await ziaBackendCall(query, 'GET', undefined)
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
            var query = `ops/labelSpendReport?startDate=${startDate}&endDate=${today}&format=json`
            if(props.carrierIds) {
                query += `&carrierIds=${props.carrierIds}`
            }
            if(props.serviceCodes) {
                query += `&serviceCodes=${props.serviceCodes}`
            }
            if(props.serviceProviders) {
                query += `&serviceProviders=${props.serviceProviders}`
            }
            const response = await ziaBackendCall(query, 'GET', undefined)
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
            var query = `ops/labelSpendReport?startDate=${startDate}&endDate=${today}&format=json`
            if(props.carrierIds) {
                query += `&carrierIds=${props.carrierIds}`
            }
            if(props.serviceCodes) {
                query += `&serviceCodes=${props.serviceCodes}`
            }
            if(props.serviceProviders) {
                query += `&serviceProviders=${props.serviceProviders}`
            }
            const response = await ziaBackendCall(query, 'GET', undefined)
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
                    var query = `ops/labelSpendReport?startDate=${startDate}&endDate=${endDate}&format=json`
                    if(props.carrierIds) {
                        query += `&carrierIds=${props.carrierIds}`
                    }
                    if(props.serviceCodes) {
                        query += `&serviceCodes=${props.serviceCodes}`
                    }
                    if(props.serviceProviders) {
                        query += `&serviceProviders=${props.serviceProviders}`
                    }
                    const response = await ziaBackendCall(query, 'GET', undefined)
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
          list={[...[{isDivider: true, name: 'Total  Shipments'}], ...[
            { name: 'Shipments', value: data?.summary?.labelCount },
            { name: 'Total Cost', value: `$${data?.summary?.totalCost}` },
          ], ...[{isDivider: true, name: 'By Service'}], 
          ...(Object.entries(data?.summary?.byService || {}).map(([key, value]: [string, any]) => ({ name: key, value: `${value.labelCount} / $${value.totalCost}` }))), 
          ...[{isDivider: true, name: 'By Account'}],
          ...(Object.entries(data?.summary?.byCarrier || {}).map(([key, value]: [string, any]) => ({ name: `${props.carriers?.find(carrier => carrier.carrier_id === key)?.nickname || key} (${props.carriers?.find(carrier => carrier.carrier_id === key)?.account_number || '-'})`, value: `${value.labelCount} / $${value.totalCost}` }))),
          ...[{isDivider: true, name: 'By Carrier'}],
          ...(Object.entries(data?.summary?.byCarrierName || {}).map(([key, value]: [string, any]) => ({ name: key, value: `${value.labelCount} / $${value.totalCost}` })))
        ]}
          alignFinalRight={true}
          actionFunction={() => {}}
          actionFunctions={[]}
          headers={[{ name: 'Shipment Summary'}, { name: '' }]}
          keys={['name', 'value']}
        />}
      </ListContainer>
    </PageStandard>
  );
}