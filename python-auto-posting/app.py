# bio file is relative to the app.py file called bio.txt

# goal for this app is to every day from 8AM to 5PM 3 times a day create an x post that is engaging and interesting to read, promoting the AppliedTrack platform and pushing users to sign up for the waitlist.

# use openai gpt-4o-mini to generate the post

# use this webhook to post to x: https://hook.us1.make.com/volcmv54n75fj1429cl4vayhkcxfhpvq with the param of text-content as the post

# the post should be 100-150 words, and contain an appropriate number of hashtags and emojis

# the post should contain a link to the waitlist page of the platform > https://appliedtrack.com

import os
from openai import OpenAI
import requests
import schedule
import time
import random
from datetime import datetime, time as dtime
import logging

client = OpenAI()

RUN_SCHEDULER = True

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def is_within_posting_hours():
    """Check if current time is between 8 AM and 5 PM"""
    current_time = datetime.now().time()
    start_time = dtime(8, 0)  # 8 AM
    end_time = dtime(17, 0)   # 5 PM
    return start_time <= current_time <= end_time

def generate_post():
    with open("bio.txt", "r") as file:
        bio = file.read()

    prompt = f"""Generate an engaging social media post for X (Twitter) promoting AppliedTrack. The post should:

    - Be 20-30 words long
    - Include relevant emojis naturally throughout
    - Include 3-4 relevant hashtags at the end
    - Highlight a key benefit or feature from this bio: {bio}
    - Have a clear call-to-action to join the waitlist at https://appliedtrack.com
    - Use a conversational, friendly tone
    - Create a sense of urgency or FOMO
    - Focus on solving job seekers' pain points
    - Be engaging and shareable

    The post should feel organic and helpful, not overly promotional. Make it resonate with job seekers who are struggling to stay organized in their job search."""

    # logger.info(f"Generating post with prompt: {prompt}")
    random_seed = random.randint(1, 1000000)
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": prompt}],
        temperature=0.7,
        max_tokens=150,
        seed=random_seed
    )

    return response.choices[0].message.content.strip()

def post_to_x(post):
    try:
        url = "https://hook.us1.make.com/volcmv54n75fj1429cl4vayhkcxfhpvq"
        data = {"text-content": post}
        response = requests.post(url, json=data)
        response.raise_for_status()
        logger.info(f"Successfully posted to X at {datetime.now()}")
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to post to X: {str(e)}")

def schedule_posts_for_today():
    """Schedule 3 random posting times for today between 8 AM and 5 PM"""
    # Clear any existing jobs
    schedule.clear()
    
    # Generate 3 random times between 8 AM and 5 PM
    posting_minutes = random.sample(range(9 * 60), 3)  # 9 hours = 540 minutes
    posting_times = []
    
    for minutes in posting_minutes:
        hours = 8 + (minutes // 60)  # Add 8 to start at 8 AM
        mins = minutes % 60
        posting_times.append(f"{hours:02d}:{mins:02d}")
        
        # Schedule the post
        schedule.every().day.at(f"{hours:02d}:{mins:02d}").do(make_post)
    
    logger.info(f"Scheduled posts for today at: {', '.join(posting_times)}")

def make_post():
    """Generate and post content"""
    if is_within_posting_hours():
        post = generate_post()
        logger.info(f"Generated post: {post}")
        post_to_x(post)

def run_scheduler():
    """Main function to run the scheduler"""
    while True:
        if datetime.now().time() < dtime(8, 0):
            # If it's before 8 AM, schedule posts for today
            schedule_posts_for_today()
        
        schedule.run_pending()
        time.sleep(60)  # Check every minute

def dev_function():
    post = generate_post()
    logger.info("--------------------------------")
    logger.info(f"Generated post: {post} at {datetime.now()}")
    logger.info("--------------------------------")
    post_to_x(post)

if __name__ == "__main__":
    logger.info("Starting AppliedTrack auto-posting service")
    if RUN_SCHEDULER:
        run_scheduler()
    else:
        logger.info("Scheduler is disabled. Set RUN_SCHEDULER to True to enable automatic posting.")
        dev_function()