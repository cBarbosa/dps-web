import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DetailDataCard, ProposalDataType } from "./details-present";
import { MapIcon } from "lucide-react";

export default function AddressProposal({
    data
}: {
    data: ProposalDataType
}) {

    return (
        <div className="p-5 w-full max-w-7xl mx-auto bg-white rounded-3xl">
			<Accordion type="single" collapsible>
			<AccordionItem value="item-1">
				<AccordionTrigger>
					<h4 className="basis-1 grow text-lg text-primary mb-2 text-left">Endereço</h4>
				</AccordionTrigger>
				<AccordionContent>
                    <div className="flex gap-6 justify-between items-center">
                        <div className="mt-4 flex gap-5 text-muted-foreground">

                            <DetailDataCard
                                label="Endereço"
                                value={`${data.addressStreet}${(data.addressNumber && `, ${data.addressNumber}`)}${data.addressZipcode && `, CEP: ${data.addressZipcode}`}`}
                            >
                                <MapIcon />
                            </DetailDataCard>

                            <DetailDataCard
                                label="Bairro"
                                value={data.addressNeighborhood ?? `-`}
                            >
                                <MapIcon />
                            </DetailDataCard>

                            <DetailDataCard
                                label="Cidade"
                                value={data.addressCity && data.addressState && `${data.addressCity}/${data.addressState}`}
                            >
                                <MapIcon />
                            </DetailDataCard>
                        </div>
                    </div>
				</AccordionContent>
			</AccordionItem>
			</Accordion>
		</div>
    );
};
