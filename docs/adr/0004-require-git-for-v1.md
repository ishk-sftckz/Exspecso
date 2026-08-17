# Require Git for V1

Exspecso V1 will operate only inside an existing Git repository because repository discovery, drift detection, review boundaries, recovery, and verified Task commits are part of its reliability model. When Git is absent, initialization may offer to create a repository only after explicit user confirmation; V1 will not silently initialize Git or maintain a weaker non-Git workflow.
