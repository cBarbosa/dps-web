import s from './login-area.module.css'
import Image from 'next/image'

export default async function LoginAreaLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div className="flex flex-row w-full h-screen min-h-min">
			<div className="grow basis-1/3">
				<div
					className={
						'flex h-full flex-col p-10 justify-between items-start ' + s.display
					}
				>
					<div>
						<Image
							src="/static/images/app-logo-white.png"
							width="272"
							height="81"
							alt="Logo"
						/>
					</div>
					<h2 className="text-4xl font-semibold text-white">
						Sistema de Emissão de Declaração Pessoal
					</h2>
				</div>
			</div>
			<div className="grow basis-2/3 p-5">{children}</div>
		</div>
	)
}
