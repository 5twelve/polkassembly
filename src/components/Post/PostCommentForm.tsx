// Copyright 2019-2025 @polkassembly/polkassembly authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { CheckOutlined } from '@ant-design/icons';
import { Button, Form } from 'antd';
import { IAddPostCommentResponse } from 'pages/api/v1/auth/actions/addPostComment';
import React, { FC, useEffect, useState } from 'react';
import ErrorAlert from 'src/ui-components/ErrorAlert';
import UserAvatar from 'src/ui-components/UserAvatar';
import styled from 'styled-components';

import { ChangeResponseType } from '~src/auth/types';
import { usePostDataContext, useUserDetailsContext } from '~src/context';
import CommentSentimentModal from '~src/ui-components/CommentSentimentModal';
import nextApiClientFetch from '~src/util/nextApiClientFetch';

import ContentForm from '../ContentForm';
import queueNotification from '~src/ui-components/QueueNotification';
import { NotificationStatus } from '~src/types';
import { Input } from 'antd';
import { IComment } from './Comment/Comment';
import { getSubsquidLikeProposalType } from '~src/global/proposalType';
import EmojiIcon from '~assets/icons/chatbox-icons/emoji-1.svg';

interface IPostCommentFormProps {
	className?: string;
	isUsedInSuccessModal?: boolean;
	voteDecision? :string
	setSuccessModalOpen?: (pre: boolean) => void;
setCurrentState?:(postId: string, type:string, comment: IComment) => void;
}

const commentKey = () => `comment:${global.window.location.href}`;

const PostCommentForm: FC<IPostCommentFormProps> = (props) => {
	const { className , isUsedInSuccessModal = false ,  voteDecision = null, setSuccessModalOpen = () => {return null; },setCurrentState } = props;
	const { id, username, picture } = useUserDetailsContext();
	const { postData: { postIndex, postType } } = usePostDataContext();
	const [content, setContent] = useState(global.window.localStorage.getItem(commentKey()) || '');
	const [form] = Form.useForm();
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [openModal,setModalOpen]=useState(false);
	const [isComment,setIsComment]=useState(false);
	const [sentiment,setSentiment]=useState<number>(3);
	const [isSentimentPost,setIsSentimentPost]=useState(false);
	const [textBoxHeight,setTextBoxHeight] = useState(40);

	const onContentChange = (content: string) => {
		setContent(content);
		global.window.localStorage.setItem(commentKey(), content);
		return content.length ? content : null;
	};

	const createSubscription = async (postId: number | string) => {
		const { data , error } = await nextApiClientFetch<ChangeResponseType>( 'api/v1/auth/actions/postSubscribe', { post_id: postId, proposalType: postType });
		if(error) console.error('Error subscribing to post', error);
		if(data) console.log(data.message);
	};

	const handleModalOpen=async() => {
		await form.validateFields();
		const content = form.getFieldValue('content');
		console.log('value in save', content);
		if(!content) return;
		setModalOpen(true);
	};

	const handleSave = async () => {
		await form.validateFields();
		const content = form.getFieldValue('content');
		if(!content) return;

		setLoading(true);

		const { data , error } = await nextApiClientFetch<IAddPostCommentResponse>( 'api/v1/auth/actions/addPostComment', {
			content,
			postId: postIndex,
			postType: postType,
			sentiment:isSentimentPost?sentiment:0,
			userId: id
		});
		console.log('data',data);

		if(error || !data) {
			setError(error || 'No data returned from the saving comment query');
			queueNotification({
				header: 'Failed!',
				message: error,
				status: NotificationStatus.ERROR
			});
		}
		if(data) {
			setContent('');
			form.resetFields();
			form.setFieldValue('content', '');
			global.window.localStorage.removeItem(commentKey());
			postIndex && createSubscription(postIndex);
			if(isUsedInSuccessModal){
				setSuccessModalOpen(false);
			}
			queueNotification({
				header: 'Success!',
				message: 'Comment created successfully.',
				status: NotificationStatus.SUCCESS
			});
			const comment=  {
				comment_reactions: {
					'👍': {
						count: 0,
						usernames: []
					},
					'👎': {
						count: 0,
						usernames: []
					}
				},
				content,
				created_at: new Date(),
				history: [],
				id: data?.id || '',
				profile: picture || '',
				replies: [],
				sentiment:isSentimentPost? sentiment : 0,
				updated_at: new Date(),
				user_id: id as any,
				username: username || '',
				vote:voteDecision
			};
			setCurrentState && setCurrentState(postIndex.toString(), getSubsquidLikeProposalType(postType as any), comment);
		}
		setLoading(false);
		setIsComment(false);
		setIsSentimentPost(false);
		setSentiment(3);
	};

	function adjustHeightByString(inputString:any) {
		const increment = 50;
		const heightIncrement = 15;

		let currentHeight = 40;

		const updateHeight = () => {
			currentHeight += heightIncrement;
			setTextBoxHeight(currentHeight);
		};

		if (inputString.length > increment) {
			const stringLengthMultiple = Math.floor(inputString.length / increment);
			currentHeight = 40 + stringLengthMultiple * heightIncrement;
		}

		if (inputString.length % increment === 0) {
			updateHeight();
		}
		console.log(currentHeight);
		return currentHeight;
	}
	useEffect(() => {
		isComment && handleSave();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	},[isComment]);

	if (!id) return <div>You must log in to comment.</div>;

	return (
		<div className={className}>
			<UserAvatar
				className='mt-4 hidden md:inline-block'
				username={username || ''}
				size={'large'}
				id={id}
			/>

			<div className={isUsedInSuccessModal ? 'p-[1rem] w-[95%]' : 'comment-box bg-white p-[1rem]'}>
				{error && <ErrorAlert errorMsg={error} className='mb-2' />}
				<Form
					form={form}
					name="comment-content-form"
					layout="vertical"
					onFinish={handleModalOpen}
					initialValues={{
						content
					}}
					disabled={loading}

					validateMessages= {
						{ required: "Please add the  '${name}'" }
					}
				>
					<div className={isUsedInSuccessModal ? 'flex justify-between items-center w-[522px] -ml-[30px]' : ''}>
						{
							isUsedInSuccessModal && <Form.Item name='content' className='w-full'>
								<Input
									name='content'
									className={`w-full h-[${textBoxHeight}px] border-[1px] rounded-[4px] text-sm mt-0 suffixColor hover:border-pink_primary flex-1`}
									onChange = {(e) => {onContentChange(e.target.value);adjustHeightByString(e.target.value);}}
									placeholder={'Type your comment here'}
								/>
							</Form.Item>

						}
						{
							!isUsedInSuccessModal && <ContentForm  onChange = {(content : any) => onContentChange(content)} height={200}/>
						}
						<Form.Item>
							<div className={ isUsedInSuccessModal ?'ml-2' :'flex items-center justify-end mt-[-40px]'}>
								{
									isUsedInSuccessModal ?
										<div className="flex">
											<Button className="w-10 h-10 mr-[10px] pt-2 pl-[9px]" disabled={!content} htmlType="submit"><EmojiIcon /></Button>
											<Button disabled={!content} loading={loading} htmlType="submit" className={`bg-pink_primary text-white border-none h-[40px] w-[67px] hover:bg-pink_secondary flex items-center justify-center my-0 ${!content ? 'opacity-50' : ''}`}>Post</Button>
										</div>
										:
										<Button disabled={!content} loading={loading} htmlType="submit" className={`bg-pink_primary text-white border-white hover:bg-pink_secondary flex items-center my-0 ${!content ? 'bg-gray-500 hover:bg-gray-500' : ''}`}>
											<CheckOutlined /> Comment
										</Button>
								}
							</div>
						</Form.Item>
					</div>
				</Form>
			</div>
			{openModal && <CommentSentimentModal
				setSentiment={setSentiment}
				openModal={openModal}
				setModalOpen={setModalOpen}
				setIsComment={setIsComment}
				setIsSentimentPost={setIsSentimentPost}
				sentiment={sentiment}
			/>}
		</div>
	);
};

export default styled(PostCommentForm)`
	display: flex;
	margin: 2rem 0;

	.comment-box {
		width: calc(100% - 60px);
		
		@media only screen and (max-width: 768px) {
			width: calc(100%);
			padding: 0.5rem;
		}
	}

	.button-container {
		width: 100%;
		display: flex;
		justify-content: flex-end;
	}
`;
