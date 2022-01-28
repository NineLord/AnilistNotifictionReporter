const { isEqual } = require('lodash');
const { config } = require('dotenv');
config();

const FileSystemRequest = require('./utils/fileSystemRequest');
const { Logger, LoggerData } = require('./logger');

class Reporter {
	/*
	 * ActivityLikeNotification
	 * ActivityReplyLikeNotification
	 * ThreadCommentLikeNotification
	 * ThreadLikeNotification
	 */
	#likes; // Maps between user to his likes counter.

	/*
	 * ActivityMessageNotification
	 * ActivityMentionNotification
	 * ActivityReplyNotification
	 * ActivityReplySubscribedNotification
	 * ThreadCommentMentionNotification
	 * ThreadCommentReplyNotification
	 * ThreadCommentSubscribedNotification
	 */
	#comments; // Set of message/comment/reply activity that needs to be taken care of.

	/*
	 * FollowingNotification
	 */
	#follows; // Set of users that started following me

	/*
	 * AiringNotification
	 * RelatedMediaAdditionNotification
	 * MediaDataChangeNotification
	 * MediaMergeNotification
	 * MediaDeletionNotification
	*/
	#mediaUpdates; // List of site updates about the media.

	#lastActivity; // json of the last added activity

	//#region Constructor
	constructor() {
		this.#likes = {};
		this.#comments = {
			activityId: {},
			message: new Set(),
			commentId: new Set()
		};
		this.#follows = new Set();
		this.#mediaUpdates = [];
		this.#lastActivity = undefined;
	}

	async initialize() {
		return FileSystemRequest.existsAsync(process.env.REPORTER_FILE_NAME)
			.then(exists => {
				Logger.debug('Reporter/initialize', `Got back from existsAsync with file name {${process.env.REPORTER_FILE_NAME}}`, exists);
				if (exists)
					return FileSystemRequest.readAsync(process.env.REPORTER_FILE_NAME)
						.then(data => {
							Logger.debug('Reporter/initialize', `Got back from readAsync with file name {${process.env.REPORTER_FILE_NAME}}`, data);
							this.deserialize(data);
						});
				else
					Logger.warn('Reporter/initialize', `${process.env.REPORTER_FILE_NAME} doesn't exists!`);
			});
	}
	//#endregion

	//#region Convert to Anilist URL
	#getAnimeURL(animeId) { // TODO: mediaId needs his own function, but I'm not sure what the options are there. for now I'll use it for anime only.
		return `https://anilist.co/anime/${animeId}/`;
	}

	#getUserURL(name) {
		return `https://anilist.co/user/${name}/`;
	}

	#getActivityURL(activityId) {
		return `https://anilist.co/activity/${activityId}/`;
	}

	#getCommentURL(threadId, commentId) {
		return `https://anilist.co/forum/thread/${threadId}/comment/${commentId}`;
	}

	#getThreadURL(threadId) {
		return `https://anilist.co/forum/thread/${threadId}/`;
	}
	//#endregion

	addActivity(activity) {
		switch (activity['type']) {
			case 'ACTIVITY_LIKE': // ActivityLikeNotification
			case 'ACTIVITY_REPLY_LIKE': // ActivityReplyLikeNotification
			case 'THREAD_COMMENT_LIKE': // ThreadCommentLikeNotification
			case 'THREAD_LIKE': // ThreadLikeNotification
				const name = this.#getUserURL(activity['user']['name']);
				this.#likes[name] = this.#likes[name] === undefined ? 1 : this.#likes[name] + 1;
				break;

			case 'ACTIVITY_MESSAGE': // ActivityMessageNotification
				this.#comments.message.add(this.#getActivityURL(activity['activityId']));
				break;
			case 'ACTIVITY_MENTION': // ActivityMentionNotification
			case 'ACTIVITY_REPLY': // ActivityReplyNotification
			case 'ACTIVITY_REPLY_SUBSCRIBED': // ActivityReplySubscribedNotification
				const link = this.#getActivityURL(activity['activityId']);
				this.#comments.activityId[link] = {
					activity: activity['activity'],
					sender: this.#getUserURL(activity['user']['name'])
				};
				break;
			case 'THREAD_COMMENT_MENTION': // ThreadCommentMentionNotification
			case 'THREAD_COMMENT_REPLY': // ThreadCommentReplyNotification
			case 'THREAD_SUBSCRIBED': // ThreadCommentSubscribedNotification
				const commentId = activity['commentId'];
				const threadId = activity['thread']['id'];
				this.#comments.commentId.add(this.#getCommentURL(threadId, commentId));
				break;

			case 'FOLLOWING': // FollowingNotification
				this.#follows.add(this.#getUserURL(activity['user']['name']));
				break;

			case 'AIRING': // AiringNotification
				this.#mediaUpdates.push(this.#getAnimeURL(activity['animeId']));
				break;
			case 'RELATED_MEDIA_ADDITION': // RelatedMediaAdditionNotification
			case 'MEDIA_DATA_CHANGE': // MediaDataChangeNotification
			case 'MEDIA_MERGE': // MediaMergeNotification
				this.#mediaUpdates.push(this.#getAnimeURL(activity['mediaId']));
				break;
			case 'MEDIA_DELETION': // MediaDeletionNotification
				this.#mediaUpdates.push(`The media ${activity['deletedMediaTitle']} was deleted from the site`);
				break;
			default:
				throw new LoggerData(LoggerData.LEVEL.Error, 'Reporter/addActivity', `Unknown activity type`, activity);
		}
	}

	addPage(activities) {
		if (activities.length === 0)
			return true;

		let result = false;
		if (this.#lastActivity === undefined) {
			this.#lastActivity = activities[0];
			result = true;
			// If didn't have lastActivity then do the first page we get and exit.
		}

		for (let activity of activities) {

			if (result) {
				this.addActivity(activity);
			} else if (isEqual(this.#lastActivity, activity)) {
				return true;
			} else {
				this.addActivity(activity);
			}

		}
		return result;
	}

	updateLastActivity(activities) {
		if (activities.length === 0)
			this.#lastActivity = undefined;
		else
			this.#lastActivity = activities[0];
	}

	//#region serialization
	#setToJSON(set) {
		return {
			class: 'Set',
			data: [...set.keys()]
		}
	}
	#JSONtoSet(json) {
		if (json['class'] !== 'Set')
			throw new Error("Incorrect json given to JSONtoSet");

		const set = new Set();
		for (let item of json['data']) {
			set.add(item);
		}
		return set;
	}

	serialize() {
		return {
			likes: this.#likes,
			comments: {
				activityId: this.#comments.activityId,
				message: this.#setToJSON(this.#comments.message),
				commentId: this.#setToJSON(this.#comments.commentId)
			},
			follows: this.#setToJSON(this.#follows),
			mediaUpdates: this.#mediaUpdates,
			lastActivity: this.#lastActivity
		};
	}
	serializePretty() {
		const json = this.serialize();
		json['likes'] = Object.fromEntries( Object.entries(json['likes']) .sort(([,a],[,b]) => a-b) );
		return json;
	}
	deserialize(json) { // TODO: add validation here
		this.#likes = json['likes'];
		this.#comments = {
			activityId: json['comments']['activityId'],
			message: this.#JSONtoSet(json['comments']['message']),
			commentId: this.#JSONtoSet(json['comments']['commentId']),
		};
		this.#follows = this.#JSONtoSet(json['follows']);
		this.#mediaUpdates = json['mediaUpdates'];
		this.#lastActivity = json['lastActivity'];
	}
	toString() {
		return JSON.stringify(this.serializePretty(), null, 2);
	}
	//#endregion
}

module.exports = new Reporter();