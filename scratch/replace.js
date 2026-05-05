const fs = require('fs');
const path = 'c:/BarberConnect/web/barberconnect-frontend/src/pages/customer/CustomerDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const newFeed = `            <section className="barber-feed">
              <h2>Barber Feed</h2>
              <div className="feed-posts">
                {postsLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                    Loading posts...
                  </div>
                ) : posts.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                    No posts yet. Check back soon!
                  </div>
                ) : (
                  posts.map((post) => (
                    <div key={post.post_id} className="post-card">
                      <div className="post-header">
                        <div className="post-avatar">
                          <img src="/api/placeholder/40/40" alt="Barber" />
                        </div>
                        <div className="post-info">
                          <h4>Barber Post</h4>
                          <span>
                            {post.createdAt
                              ? new Date(post.createdAt).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric', year: 'numeric'
                                })
                              : 'Recently'}
                          </span>
                        </div>
                      </div>
                      <div className="post-content">
                        <p>{post.content}</p>
                        {post.imageUrl && (
                          <div className="post-image">
                            <img
                              src={post.imageUrl}
                              alt="Post"
                              style={{ width: '100%', borderRadius: '8px', marginTop: '10px' }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="post-actions">
                        <button className="action-btn">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          {post.likesCount ?? 0}
                        </button>
                        <button className="action-btn">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          {post.commentsCount ?? 0}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>`;

const regex = /<section className="barber-feed">[\s\S]*?<\/section>/;
content = content.replace(regex, newFeed);
fs.writeFileSync(path, content);
