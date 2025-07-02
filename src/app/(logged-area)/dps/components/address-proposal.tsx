import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion";
import { ProposalDataType } from "./details-present";
import { MapIcon } from "lucide-react";

export default function AddressProposal({
    data
}: {
    data: ProposalDataType
}) {

    return (
        <div className="m-10 w-full max-w-7xl mx-auto bg-white">
			<Accordion type="single" collapsible className="p-4 m-4 bg-gray-100 rounded-3xl">
                <AccordionItem value="item-1" className="last:border-none">
                    <AccordionTrigger>
                        <div className="flex">
                            <MapIcon className="text-green-950 mr-2"/>
                            <h4 className="text-lg text-primary mb-2">Endereço</h4>
                            <span className="text-xs text-primary ml-2 no-underline pointer-events-none">
                                (do imóvel financiado ou imóvel em garantia)
                            </span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="columns-2 justify-between items-center">
                            <div className="flex flex-col w-full py-2">
                                <h3 className="text-xs text-primary">CEP</h3>
                                <h2 className="text-sm text-green-950">{data.addressZipcode}</h2>
                            </div>

                            <div className="flex flex-col w-full py-2">
                                <h3 className="text-xs text-primary">Endereço</h3>
                                <h2 className="text-sm text-green-950">{data.addressStreet} {data.addressNumber && `, Número: ${data.addressNumber}`}</h2>
                            </div>

                            <div className="flex flex-col w-full py-2">
                                <h3 className="text-xs text-primary">Bairro</h3>
                                <h2 className="text-sm text-green-950">{data.addressNeighborhood}</h2>
                            </div>

                            <div className="flex flex-col w-full py-2">
                                <h3 className="text-xs text-primary">Cidade</h3>
                                <h2 className="text-sm text-green-950">
                                    {data.addressCity}/{data.addressState}
                                </h2>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
			</Accordion>
		</div>
    );
};
