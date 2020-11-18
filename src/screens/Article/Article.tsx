import React, {useState, useEffect, useCallback} from 'react';
import {useSelector, useDispatch, shallowEqual} from 'react-redux';
import {Helmet} from 'react-helmet';
import Typography from '@material-ui/core/Typography';
import {useParams} from 'react-router';
import SortIcon from '@material-ui/icons/Sort';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import {loader} from 'graphql.macro';
import {useMutation} from 'react-apollo';

import './Article.scss';
import {RemoveModal} from '@components/common/modals';
import FullArticle from './components/FullArticle';
import CommentForm from './components/CommentForm';
import CommentReplies from './components/CommentReplies';
import {useRedirect, useArticle, useAuthModal} from '@utils/hooks';
import {getCommentsCount} from '@utils/articles';
import ZoomTooltip from '@components/common/tooltips/ZoomTooltip';
import {RootState} from '@store/types';
import {IComment} from '@store/types';
import * as articleActions from '@store/articles/actions';
import Context from './context';
import Loader from '@components/common/loaders/Loader';

const AddLike = loader('./gql/AddLike.gql');
const AddDislike = loader('./gql/AddDislike.gql');
const AddView = loader('./gql/AddView.gql');

const Article: React.FC = () => {
	const {slug} = useParams();

	const [removeArticleModal, setRemoveArticleModal] = useState(false);
	const [loading, setLoading] = useState(true);
	const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
	const [article, setArticleSlug] = useArticle();

	const [addLike] = useMutation(AddLike);
	const [addDislike] = useMutation(AddDislike);
	const [addView] = useMutation(AddView);

	const {redirectTo} = useRedirect();
	const {openAuthModal} = useAuthModal();

	const openSortMenu = (e: React.MouseEvent<HTMLButtonElement>): void => {
		setAnchorEl(e.currentTarget);
	};

	const closeSortMenu = (): void => {
		setAnchorEl(null);
	};

	const auth = useSelector((state: RootState) => state.auth, shallowEqual);
	const dispatch = useDispatch();

	const setViews = useCallback(() => {
		if (loading) {
			if (article) {
				addView({variables: {id: article._id}});

				setLoading(false);
			}
		}
	}, [article, addView, loading]);

	useEffect(() => {
		if (slug) {
			setArticleSlug(slug);
		}

		setViews();
	}, [slug, setArticleSlug, setViews]);

	const handleAddArticleLike = async (): Promise<void> => {
		if (!auth.isAuth) {
			return openAuthModal();
		}

		if (article) {
			addLike({variables: {id: article._id}});
		}
	};

	const handleAddArticleDislike = async (): Promise<void> => {
		if (!auth.isAuth) {
			return openAuthModal();
		}

		if (article) {
			addDislike({variables: {id: article._id}});
		}
	};

	const handleAddArticleToBookmarks = async (): Promise<void> => {
		if (!auth.isAuth) {
			return openAuthModal();
		}

		if (article) {
			await dispatch(articleActions.addToBookmarks(article._id, auth.user._id));
		}
	};

	const handleRemoveArticle = async (): Promise<void> => {
		if (article) {
			await dispatch(articleActions.removeArticle(article._id));

			setRemoveArticleModal(false);

			redirectTo('/');
		}
	};

	const handleSubmitComment = async (comment: {text: string}): Promise<any> => {
		if (article) {
			const data = await dispatch(
				articleActions.addComment({...comment, articleId: article._id, user: auth.user._id}),
			);

			return data;
		}
	};

	const handleRemoveComment = async (commentId: string): Promise<void> => {
		await dispatch(articleActions.removeComment(commentId));
	};

	const handleSubmitReply = async (comment: {parentId: string; text: string}): Promise<any> => {
		if (article) {
			const data = await dispatch(
				articleActions.addReply({...comment, articleId: article._id, user: auth.user._id}),
			);

			return data;
		}
	};

	const handleRemoveReply = async (commentId: string): Promise<void> => {
		await dispatch(articleActions.removeReply(commentId));
	};

	const _handleTopCommentsSort = (): void => {
		if (article) {
			dispatch(articleActions.sortCommentsByTopArticles(article._id));
		}

		closeSortMenu();
	};

	const _handleNewestFirstSort = (): void => {
		if (article) {
			dispatch(articleActions.sortCommentsByNewestFirst(article._id));
		}

		closeSortMenu();
	};

	const handleAddCommentLike = async (commentId: string): Promise<void> => {
		if (!auth.isAuth) {
			return openAuthModal();
		}

		if (article) {
			await dispatch(articleActions.addCommentLike(article._id, commentId));
		}
	};

	const handleAddCommentDislike = async (commentId: string): Promise<void> => {
		if (!auth.isAuth) {
			return openAuthModal();
		}

		if (article) {
			await dispatch(articleActions.addCommentDislike(article._id, commentId));
		}
	};

	if (loading) {
		return <Loader disableMargin />;
	}

	return (
		<section className='article'>
			<Helmet>
				<title>
					{article ? article.title : 'Article'} / {process.env.REACT_APP_TITLE}
				</title>
				{article && (
					<>
						{article.image && <meta property='og:image' content={article.image} />}
						<meta property='og:title' content={article.title} />
						<meta property='og:description' content={article.text.slice(250)} />
						<meta property='og:type' content='article' />
						<meta
							property='og:url'
							content={`https://delo.westerntrojan.now.sh/article/${article.slug}`}
						/>
					</>
				)}
			</Helmet>

			<Context.Provider
				value={{auth, submitReply: handleSubmitReply, removeReply: handleRemoveReply}}
			>
				{article && (
					<>
						<FullArticle
							article={article}
							addLike={handleAddArticleLike}
							addDislike={handleAddArticleDislike}
							addToBookmarks={handleAddArticleToBookmarks}
							handleRemove={(): void => setRemoveArticleModal(true)}
						/>

						<div className='comments'>
							<div className='comments-title'>
								<Typography variant='h5' className='caption'>
									{getCommentsCount(article)} Comments
								</Typography>

								<ZoomTooltip title='Sort comments'>
									<Button size='small' startIcon={<SortIcon />} onClick={openSortMenu}>
										Sort by
									</Button>
								</ZoomTooltip>
								<Menu
									anchorEl={anchorEl}
									keepMounted
									open={Boolean(anchorEl)}
									onClose={closeSortMenu}
								>
									<MenuItem onClick={_handleTopCommentsSort}>Top Comments</MenuItem>
									<MenuItem onClick={_handleNewestFirstSort}>Newest first</MenuItem>
								</Menu>
							</div>

							<CommentForm submit={handleSubmitComment} />

							<div className='comments-list'>
								{article.comments.map((comment: IComment) => (
									<CommentReplies
										key={comment._id}
										comment={comment}
										addLike={handleAddCommentLike}
										addDislike={handleAddCommentDislike}
										handleRemove={handleRemoveComment}
									/>
								))}
							</div>
						</div>
					</>
				)}
			</Context.Provider>

			<RemoveModal
				open={removeArticleModal}
				text='Do you want to remove this article ?'
				action={handleRemoveArticle}
				closeModal={(): void => setRemoveArticleModal(false)}
			/>
		</section>
	);
};

export default Article;
