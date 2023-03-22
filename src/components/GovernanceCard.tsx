// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ClockCircleOutlined, CommentOutlined, DislikeOutlined, LikeOutlined } from '@ant-design/icons';
import { Divider, Skeleton } from 'antd';
import dynamic from 'next/dynamic';
import React, { FC, useContext } from 'react';
import { UserDetailsContext } from 'src/context/UserDetailsContext';
import { noTitle } from 'src/global/noTitle';
import useCurrentBlock from 'src/hooks/useCurrentBlock';
import OnchainCreationLabel from 'src/ui-components/OnchainCreationLabel';
import StatusTag from 'src/ui-components/StatusTag';
import getRelativeCreatedAt from 'src/util/getRelativeCreatedAt';

import { getFormattedLike } from '~src/util/getFormattedLike';

interface IGovernanceProps {
	postReactionCount: {
		'👍': number;
		'👎': number;
	};
	address: string;
	username?: string;
	className?: string
	commentsCount: number
	created_at?: Date
	end?: number
	method?: string
	onchainId?: string | number | null
	status?: string | null
	tipReason?: string
	title?: string | null
	topic?: string
	isTip?: boolean;
	tip_index?: number | null;
	isCommentsVisible?: boolean;
}

const BlockCountdown = dynamic(() => import('src/components/BlockCountdown'),{
	loading: () => <Skeleton.Button active />,
	ssr: false
});
const GovernanceCard: FC<IGovernanceProps> = (props) => {
	const {
		postReactionCount,
		address,
		className,
		commentsCount,
		created_at,
		end = 0,
		method,
		onchainId,
		status,
		tipReason,
		title,
		topic,
		isTip,
		tip_index,
		isCommentsVisible = true,
		username
	} = props;
	const currentUser = useContext(UserDetailsContext);
	let titleString = title || method || tipReason || noTitle;

	const titleTrimmed = titleString.match(/.{1,80}(\s|$)/g)![0];
	titleString = `${titleTrimmed} ${titleTrimmed.length != titleString.length ? '...' : ''}`;

	const mainTitle = <span className={tipReason ? 'tipTitle' : ''}><div>{titleString}</div></span>;
	const subTitle = title && tipReason && method && <h5>{title}</h5>;
	const currentBlock = useCurrentBlock()?.toNumber() || 0;
	const ownProposal = currentUser?.addresses?.includes(address);
	const relativeCreatedAt = getRelativeCreatedAt(created_at);
	return (
		<div className={`${className} ${ownProposal && 'border-l-pink_primary border-l-4'} border-2 border-grey_light border-solid hover:border-pink_primary hover:shadow-xl transition-all duration-200 rounded-md p-3 md:p-4`}>
			<div className="flex flex-col justify-between">
				<div className='flex lg:justify-between lg:items-start lg:flex-row'>
					<div className='mt-3 lg:mt-0'>
						<h1 className='text-sidebarBlue font-semibold text-sm flex truncate'>
							{<span className='font-medium mr-2'>#{isTip? tip_index: onchainId}</span>} {mainTitle}
						</h1>
						<h2 className='text-navBlue font-medium text-sm'>{subTitle}</h2>
					</div>
					<div className='flex justify-between items-center'>
						{status && <StatusTag status={status}/>}
					</div>
				</div>

				<div className="mt-3 gap-2.5 font-medium text-navBlue text-xs flex flex-col md:flex-row items-start md:items-center">
					<OnchainCreationLabel address={address} username={username} topic={topic} />
					<Divider className='hidden md:inline-block' type="vertical" style={{ borderLeft: '1px solid #90A0B7' }} />

					<div className='flex items-center gap-x-2'>
						<div className='flex items-center justify-center gap-x-1.5'>
							<LikeOutlined />
							<span>{getFormattedLike(postReactionCount['👍'])}</span>
						</div>
						<Divider className='hidden md:inline-block' type="vertical" style={{ borderLeft: '1px solid #90A0B7' }} />
						<div className='flex items-center justify-center gap-x-1.5'>
							<DislikeOutlined />
							<span>{getFormattedLike(postReactionCount['👎'])}</span>
						</div>
						{
							isCommentsVisible?
								<>
									<Divider className='hidden md:inline-block' type="vertical" style={{ borderLeft: '1px solid #90A0B7' }} />
									<div className='flex items-center'>
										<CommentOutlined className='mr-1' /> {commentsCount}
									</div>
								</>
								: null
						}
						<Divider type="vertical" style={{ borderLeft: '1px solid #90A0B7' }} />
						{relativeCreatedAt && <>
							<div className='flex items-center'>
								<ClockCircleOutlined className='mr-1' /> {relativeCreatedAt}
							</div>
						</>}
					</div>

					{!!end && !!currentBlock &&
							<div className="flex items-center">
								<Divider className='hidden md:inline-block' type="vertical" style={{ borderLeft: '1px solid #90A0B7' }} />
								<ClockCircleOutlined className='mr-1' />
								{
									end > currentBlock
										? <span><BlockCountdown endBlock={end}/> remaining</span>
										: <span>ended <BlockCountdown endBlock={end}/></span>
								}
							</div>
					}
				</div>
			</div>
		</div>
	);
};

export default GovernanceCard;