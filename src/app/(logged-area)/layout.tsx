import SideBar from './components/side-bar'
import { TopBar } from './components/top-bar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-screen flex-row">
			<div className="relative grow-0 shrink-0 basis-[260px] bg-white">
				<div className="sticky w-full h-screen top-0 left-0">
					<SideBar />
				</div>
			</div>

			<div className="relative grow pt-[90px]">
				<div className="sticky -mt-[90px] top-0 left-0 h-[90px] bg-white w-full shadow-sm">
					<TopBar />
				</div>
				<div className="min-h-full min-w-full bg-[#F7F7F7]">{children}</div>
			</div>
		</div>
	)
}
