#!/bin/bash

# Run database migration with automatic confirmation
echo "Yes, I want to execute all statements" | npm run db:push
